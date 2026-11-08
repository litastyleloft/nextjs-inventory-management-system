import { auth } from "@/auth";
import { readAvatar } from "@/lib/avatars";

// proxy.ts skips image file extensions, so this route checks the session itself.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });

  const avatar = await readAvatar((await params).file);
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatar.contentType,
      "X-Content-Type-Options": "nosniff",
      // Every upload gets a new random file name, so a file never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
