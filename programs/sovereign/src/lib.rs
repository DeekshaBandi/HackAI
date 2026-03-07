use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// ─── Constants ─────────────────────────────────────────────────────────────────
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 8;
pub const MAX_COLOR_LEN: usize = 7; // "#RRGGBB"
pub const INITIAL_TREASURY: u64 = 1_000_000_000_000; // 1M tokens (6 decimals)
pub const TERRITORY_BASE_POWER: u64 = 10;
pub const STARTING_MILITARY: u64 = 100;

// ─── Program ──────────────────────────────────────────────────────────────────
#[program]
pub mod sovereign {
    use super::*;

    /// Initialize the global game world. Called once by the deployer.
    ///
    /// PDA: ["game"]
    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.authority = ctx.accounts.authority.key();
        game.nation_count = 0;
        game.territory_count = 0;
        game.bump = ctx.bumps.game;

        msg!("🌍 SOVEREIGN world initialized. Authority: {}", ctx.accounts.authority.key());
        Ok(())
    }

    /// Found a new nation.
    ///
    /// Creates:
    ///   - Nation PDA ["nation", founder]
    ///   - SPL token mint PDA ["mint", nation] — nation PDA is mint authority
    ///   - Nation treasury ATA (holds initial token supply)
    ///
    /// This demonstrates: PDAs, SPL Tokens, CPI (MintTo), Associated Token Accounts
    pub fn create_nation(
        ctx: Context<CreateNation>,
        name: String,
        symbol: String,
        color: String, // hex e.g. "#E63946"
    ) -> Result<()> {
        require!(name.len() <= MAX_NAME_LEN, SovereignError::NameTooLong);
        require!(symbol.len() <= MAX_SYMBOL_LEN, SovereignError::SymbolTooLong);
        require!(color.len() <= MAX_COLOR_LEN, SovereignError::ColorTooLong);

        // Store nation data
        let nation = &mut ctx.accounts.nation;
        nation.authority = ctx.accounts.founder.key();
        nation.name = name.clone();
        nation.symbol = symbol;
        nation.color = color;
        nation.mint = ctx.accounts.national_mint.key();
        nation.treasury = ctx.accounts.national_treasury.key();
        nation.military_power = STARTING_MILITARY;
        nation.territory_count = 0;
        nation.at_war = false;
        nation.bump = ctx.bumps.nation;

        // CPI: mint initial treasury supply to nation ATA
        // Nation PDA signs as mint authority
        let founder_key = ctx.accounts.founder.key();
        let nation_seeds: &[&[u8]] = &[b"nation", founder_key.as_ref(), &[nation.bump]];
        let signer_seeds = &[nation_seeds];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.national_mint.to_account_info(),
                    to: ctx.accounts.national_treasury.to_account_info(),
                    authority: ctx.accounts.nation.to_account_info(),
                },
                signer_seeds,
            ),
            INITIAL_TREASURY,
        )?;

        ctx.accounts.game.nation_count += 1;

        msg!(
            "🏳️ Nation '{}' founded! Mint: {} | Treasury: {} tokens minted",
            name,
            ctx.accounts.national_mint.key(),
            INITIAL_TREASURY
        );
        Ok(())
    }

    /// Claim an unclaimed hex territory for your nation.
    ///
    /// Territory PDA: ["territory", x_bytes, y_bytes]
    /// First valid tx wins — PoH timestamp proves submission order on-chain.
    ///
    /// This demonstrates: PDAs as map tiles, PoH timestamp for first-move advantage
    pub fn claim_territory(
        ctx: Context<ClaimTerritory>,
        x: i16,
        y: i16,
    ) -> Result<()> {
        let territory = &mut ctx.accounts.territory;
        territory.owner = ctx.accounts.nation.key();
        territory.x = x;
        territory.y = y;
        territory.military_power = TERRITORY_BASE_POWER;
        territory.claimed_at = Clock::get()?.unix_timestamp;
        territory.bump = ctx.bumps.territory;

        ctx.accounts.nation.territory_count += 1;
        ctx.accounts.nation.military_power += TERRITORY_BASE_POWER;
        ctx.accounts.game.territory_count += 1;

        msg!(
            "📍 Territory ({},{}) claimed by '{}' at slot {}",
            x,
            y,
            ctx.accounts.nation.name,
            Clock::get()?.slot
        );
        Ok(())
    }

    /// Declare war on another nation.
    ///
    /// Opens a Battle PDA with both nations' current power levels locked in.
    /// Both nation accounts are marked at_war = true.
    ///
    /// The Battle account uses seeds from BOTH nations — this means two
    /// simultaneous battles on different pairs of nations use entirely
    /// different account sets and execute in parallel (Sealevel parallelism).
    ///
    /// PDA: ["battle", attacker_nation, defender_nation]
    pub fn declare_war(ctx: Context<DeclareWar>) -> Result<()> {
        require!(!ctx.accounts.attacker.at_war, SovereignError::AlreadyAtWar);
        require!(!ctx.accounts.defender.at_war, SovereignError::AlreadyAtWar);
        require!(
            ctx.accounts.attacker.key() != ctx.accounts.defender.key(),
            SovereignError::CannotAttackSelf
        );

        let clock = Clock::get()?;
        let battle = &mut ctx.accounts.battle;
        battle.attacker = ctx.accounts.attacker.key();
        battle.defender = ctx.accounts.defender.key();
        battle.attacker_power = ctx.accounts.attacker.military_power;
        battle.defender_power = ctx.accounts.defender.military_power;
        battle.started_at = clock.unix_timestamp;
        battle.started_slot = clock.slot;
        battle.ended_at = 0;
        battle.resolved = false;
        battle.winner = Pubkey::default();
        battle.bump = ctx.bumps.battle;

        ctx.accounts.attacker.at_war = true;
        ctx.accounts.defender.at_war = true;

        msg!(
            "⚔️ WAR DECLARED | {} (power: {}) vs {} (power: {}) | Slot: {}",
            ctx.accounts.attacker.name,
            ctx.accounts.attacker.military_power,
            ctx.accounts.defender.name,
            ctx.accounts.defender.military_power,
            clock.slot,
        );
        Ok(())
    }

    /// Resolve a battle between two nations.
    ///
    /// Determines winner by military power. In a full game, you would use
    /// a VRF or commit-reveal scheme for randomness. For the demo, power wins.
    ///
    /// Winner gains military power; loser loses it. Territories can be added
    /// as a follow-on instruction once core loop is stable.
    pub fn resolve_battle(ctx: Context<ResolveBattle>) -> Result<()> {
        require!(!ctx.accounts.battle.resolved, SovereignError::BattleAlreadyResolved);

        let clock = Clock::get()?;
        let battle = &mut ctx.accounts.battle;

        let attacker_wins = battle.attacker_power >= battle.defender_power;
        battle.resolved = true;
        battle.ended_at = clock.unix_timestamp;
        battle.winner = if attacker_wins {
            battle.attacker
        } else {
            battle.defender
        };

        let winner_name;
        if attacker_wins {
            winner_name = ctx.accounts.attacker.name.clone();
            ctx.accounts.attacker.military_power =
                ctx.accounts.attacker.military_power.saturating_add(25);
            ctx.accounts.defender.military_power =
                ctx.accounts.defender.military_power.saturating_sub(40);
        } else {
            winner_name = ctx.accounts.defender.name.clone();
            ctx.accounts.defender.military_power =
                ctx.accounts.defender.military_power.saturating_add(25);
            ctx.accounts.attacker.military_power =
                ctx.accounts.attacker.military_power.saturating_sub(40);
        };

        ctx.accounts.attacker.at_war = false;
        ctx.accounts.defender.at_war = false;

        msg!(
            "🏆 Battle resolved! Winner: '{}' | Duration: {} slots",
            winner_name,
            clock.slot.saturating_sub(battle.started_slot),
        );
        Ok(())
    }

    /// Mint additional national tokens — simulates economic production.
    /// Only the nation's founder can call this.
    ///
    /// This demonstrates: PDA-signed CPI mint, programmatic token issuance
    pub fn mint_production(ctx: Context<MintProduction>, amount: u64) -> Result<()> {
        let founder_key = ctx.accounts.founder.key();
        let bump = ctx.accounts.nation.bump;
        let nation_seeds: &[&[u8]] = &[b"nation", founder_key.as_ref(), &[bump]];
        let signer_seeds = &[nation_seeds];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.national_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.nation.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        msg!(
            "⚙️ Production: {} minted {} {} tokens",
            ctx.accounts.nation.name,
            amount,
            ctx.accounts.nation.symbol
        );
        Ok(())
    }
}

// ─── Account Contexts ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game"],
        bump
    )]
    pub game: Account<'info, GameState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, color: String)]
pub struct CreateNation<'info> {
    #[account(mut, seeds = [b"game"], bump = game.bump)]
    pub game: Account<'info, GameState>,

    /// Nation PDA — unique per founder wallet
    #[account(
        init,
        payer = founder,
        space = 8 + Nation::INIT_SPACE,
        seeds = [b"nation", founder.key().as_ref()],
        bump
    )]
    pub nation: Account<'info, Nation>,

    /// National currency mint — nation PDA is mint authority, so only the
    /// program (via CPI with nation signer seeds) can mint new tokens
    #[account(
        init,
        payer = founder,
        seeds = [b"mint", nation.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = nation,
        mint::freeze_authority = nation,
    )]
    pub national_mint: Account<'info, Mint>,

    /// Nation treasury — holds initial minted supply
    #[account(
        init,
        payer = founder,
        associated_token::mint = national_mint,
        associated_token::authority = nation,
    )]
    pub national_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub founder: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(x: i16, y: i16)]
pub struct ClaimTerritory<'info> {
    #[account(mut, seeds = [b"game"], bump = game.bump)]
    pub game: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [b"nation", authority.key().as_ref()],
        bump = nation.bump,
        has_one = authority,
    )]
    pub nation: Account<'info, Nation>,

    /// Territory PDA — one per (x,y) coordinate. Init fails if already claimed.
    #[account(
        init,
        payer = authority,
        space = 8 + Territory::INIT_SPACE,
        seeds = [b"territory", x.to_le_bytes().as_ref(), y.to_le_bytes().as_ref()],
        bump
    )]
    pub territory: Account<'info, Territory>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareWar<'info> {
    #[account(
        mut,
        seeds = [b"nation", authority.key().as_ref()],
        bump = attacker.bump,
        has_one = authority,
    )]
    pub attacker: Account<'info, Nation>,

    #[account(
        mut,
        seeds = [b"nation", defender.authority.as_ref()],
        bump = defender.bump,
    )]
    pub defender: Account<'info, Nation>,

    /// Battle account — unique to this exact attacker/defender pair.
    /// Two different battles run on non-overlapping accounts → Sealevel parallel execution.
    #[account(
        init,
        payer = authority,
        space = 8 + Battle::INIT_SPACE,
        seeds = [b"battle", attacker.key().as_ref(), defender.key().as_ref()],
        bump
    )]
    pub battle: Account<'info, Battle>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveBattle<'info> {
    #[account(
        mut,
        seeds = [b"nation", attacker.authority.as_ref()],
        bump = attacker.bump,
    )]
    pub attacker: Account<'info, Nation>,

    #[account(
        mut,
        seeds = [b"nation", defender.authority.as_ref()],
        bump = defender.bump,
    )]
    pub defender: Account<'info, Nation>,

    #[account(
        mut,
        seeds = [b"battle", attacker.key().as_ref(), defender.key().as_ref()],
        bump = battle.bump,
        has_one = attacker,
        has_one = defender,
    )]
    pub battle: Account<'info, Battle>,

    /// Anyone can resolve a battle (could be restricted to an oracle in v2)
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintProduction<'info> {
    #[account(
        seeds = [b"nation", founder.key().as_ref()],
        bump = nation.bump,
        has_one = authority @ SovereignError::NotNationAuthority,
    )]
    pub nation: Account<'info, Nation>,

    #[account(
        mut,
        seeds = [b"mint", nation.key().as_ref()],
        bump,
    )]
    pub national_mint: Account<'info, Mint>,

    /// Destination ATA (can be any wallet's ATA for the national mint)
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub founder: Signer<'info>,

    /// The authority field on the nation account
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub authority: Pubkey, // game deployer
    pub nation_count: u32,
    pub territory_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Nation {
    pub authority: Pubkey,   // founder's wallet
    #[max_len(32)]
    pub name: String,
    #[max_len(8)]
    pub symbol: String,
    #[max_len(7)]
    pub color: String,       // "#RRGGBB" for map rendering
    pub mint: Pubkey,        // national currency mint
    pub treasury: Pubkey,    // nation ATA holding supply
    pub military_power: u64, // determines battle outcome
    pub territory_count: u32,
    pub at_war: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Territory {
    pub owner: Pubkey,       // nation PDA that owns this tile
    pub x: i16,
    pub y: i16,
    pub military_power: u64,
    pub claimed_at: i64,     // unix timestamp — PoH verifiable
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Battle {
    pub attacker: Pubkey,
    pub defender: Pubkey,
    pub attacker_power: u64, // power locked at declaration time
    pub defender_power: u64,
    pub started_at: i64,
    pub started_slot: u64,   // PoH slot — proves when battle began on-chain
    pub ended_at: i64,
    pub resolved: bool,
    pub winner: Pubkey,      // Pubkey::default() until resolved
    pub bump: u8,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum SovereignError {
    #[msg("Nation name must be 32 characters or less")]
    NameTooLong,
    #[msg("Token symbol must be 8 characters or less")]
    SymbolTooLong,
    #[msg("Color must be a hex string e.g. #FF5733")]
    ColorTooLong,
    #[msg("Nation is already engaged in war")]
    AlreadyAtWar,
    #[msg("Cannot declare war on yourself")]
    CannotAttackSelf,
    #[msg("This battle has already been resolved")]
    BattleAlreadyResolved,
    #[msg("Only the nation authority can perform this action")]
    NotNationAuthority,
}
