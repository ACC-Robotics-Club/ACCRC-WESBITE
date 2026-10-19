export const metadata = {
  title: 'Admin Portal — Adamjee Cantonment College Robotics Club',
  description: 'Adamjee Cantonment College Robotics Club Administration & Fest Management Portal',
  // Keep the admin area out of search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
