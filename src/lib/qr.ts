import "server-only";
import QRCode from "qrcode";

/** QR en SVG (léger, net à l'impression), rendu côté serveur. */
export async function qrSvg(text: string, opts: { margin?: number } = {}): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: opts.margin ?? 1,
    errorCorrectionLevel: "M",
    color: { dark: "#12202F", light: "#FFFFFF" },
  });
}
