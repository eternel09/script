import QRCode from "qrcode";
import { site } from "@/lib/config";
import { handle } from "@/lib/http";

export const runtime = "nodejs";

/** QR personnel d'une fiche, en PNG téléchargeable. */
export const GET = handle(async (req: Request, { params }: { params: { slug: string } }) => {
  const slug = params.slug.replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const png = await QRCode.toBuffer(`${site.url}/t/${slug}`, {
    type: "png",
    width: 800,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#12202F", light: "#FFFFFF" },
  });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      ...(download ? { "Content-Disposition": `attachment; filename="qr-${slug}.png"` } : {}),
    },
  });
});
