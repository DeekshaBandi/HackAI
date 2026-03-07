import { NextResponse } from "next/server";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

export const GET = () => {
  const payload = {
    rules: [
      {
        pathPattern: "/api/bounty/**",
        apiPath: "/api/bounty/**",
      },
    ],
  };
  return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
};
