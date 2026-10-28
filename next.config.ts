import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "media.saugatuckdouglasgardenclub.com",
      },
      {
        protocol: "https",
        hostname: "**.saugatuckdouglasgardenclub.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com https://*.stripe.com https://js.stripe.com https://hooks.stripe.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http://127.0.0.1:* http://localhost:* https://*.stripe.com; font-src 'self'; connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https://*.supabase.co https://*.stripe.com https://api.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.stripe.com https://checkout.stripe.com;",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Core Public & Legacy WP
      {
        source: "/aboutourclub",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/aboutourclub/",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/becomeamember",
        destination: "/join",
        permanent: true,
      },
      {
        source: "/becomeamember/",
        destination: "/join",
        permanent: true,
      },
      {
        source: "/gardenwalk",
        destination: "/garden-walk",
        permanent: true,
      },
      {
        source: "/gardenwalk/",
        destination: "/garden-walk",
        permanent: true,
      },
      {
        source: "/gardens",
        destination: "/garden-walk",
        permanent: true,
      },
      {
        source: "/gardens/",
        destination: "/garden-walk",
        permanent: true,
      },
      {
        source: "/wp-login.php",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/wp-admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/wp-admin/",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/admin",
        permanent: true,
      },

      // Feeds & Events
      {
        source: "/feed",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/feed/",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/feed",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/feed/",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/list",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events/list/",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events-looped",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/events-looped/",
        destination: "/events",
        permanent: true,
      },

      // Members, Account, Profile & Password Reset
      {
        source: "/user",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/user/",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/user/:path*",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/account",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/account/",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/account/:path*",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/members",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/members/",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/members/:path*",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/password-reset",
        destination: "/forgot-password",
        permanent: true,
      },
      {
        source: "/password-reset/",
        destination: "/forgot-password",
        permanent: true,
      },
      {
        source: "/password-reset/:path*",
        destination: "/forgot-password",
        permanent: true,
      },

      // Safe Logout trailing slash redirect
      {
        source: "/logout/",
        destination: "/logout",
        permanent: true,
      },

      // Event Ticketing Checkout & Legacy Cart
      {
        source: "/tickets",
        destination: "/tickets-checkout",
        permanent: true,
      },
      {
        source: "/tickets/",
        destination: "/tickets-checkout",
        permanent: true,
      },
      {
        source: "/tickets-order",
        destination: "/tickets-checkout",
        permanent: true,
      },
      {
        source: "/tickets-order/",
        destination: "/tickets-checkout",
        permanent: true,
      },
      {
        source: "/checkout",
        destination: "/tickets-checkout",
        permanent: true,
      },
      {
        source: "/checkout/",
        destination: "/tickets-checkout",
        permanent: true,
      },

      // Payment & Customer Portal Returns
      {
        source: "/payment-successful",
        destination: "/join?status=success",
        permanent: true,
      },
      {
        source: "/payment-successful/",
        destination: "/join?status=success",
        permanent: true,
      },
      {
        source: "/payment-cancelled",
        destination: "/join?status=cancelled",
        permanent: true,
      },
      {
        source: "/payment-cancelled/",
        destination: "/join?status=cancelled",
        permanent: true,
      },
      {
        source: "/already-subscribed",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/already-subscribed/",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/subscription-cancellation",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/subscription-cancellation/",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/customer-portal",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/customer-portal/",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/stripe",
        destination: "/join",
        permanent: true,
      },
      {
        source: "/stripe/",
        destination: "/join",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
