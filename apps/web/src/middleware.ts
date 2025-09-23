export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

export default function middleware() {
  return new Response(null, { status: 200 });
}

