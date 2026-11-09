import { auth } from "@/auth";
import { isUploadKind, readUpload } from "@/lib/uploads";

// proxy.ts skips image file extensions, so this route checks the session itself.
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; file: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });

  const { kind, file } = await params;
  const upload = isUploadKind(kind) ? await readUpload(kind, file) : null;
  if (!upload) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(upload.bytes), {
    headers: {
      "Content-Type": upload.contentType,
      "X-Content-Type-Options": "nosniff",
      // Every upload gets a new random file name, so a file never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
