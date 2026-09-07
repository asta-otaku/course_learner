import { SocketProvider } from "@/context/SocketContext";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SocketProvider>{children}</SocketProvider>;
}
