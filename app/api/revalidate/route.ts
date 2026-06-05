import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "REVALIDATE_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret." }, { status: 401 });
  }

  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/tags/[tag]", "page");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
