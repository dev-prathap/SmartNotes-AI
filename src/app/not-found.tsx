import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-gray-600 text-center max-w-md">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
