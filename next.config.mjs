/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin', 'jwks-rsa'],
};

export default nextConfig;
