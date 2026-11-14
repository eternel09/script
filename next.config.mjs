/** @type {import('next').NextConfig} */
let supabaseHost = "*.supabase.co";
let supabaseProtocol = "https";
let supabasePort = "";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    supabaseHost = u.hostname;
    supabaseProtocol = u.protocol.replace(":", "");
    supabasePort = u.port;
  }
} catch {}

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: supabaseProtocol, hostname: supabaseHost, port: supabasePort, pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "qrcode"],
  },
};

export default nextConfig;
