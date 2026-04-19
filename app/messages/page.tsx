import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Pesan - SirkulasiIn",
  description: "Chat dengan penjual dan pembeli di marketplace SirkulasiIn.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/messages");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  const { room } = await searchParams;

  const currentUser = {
    id: user.id,
    name: profile?.full_name || profile?.username || user.email?.split("@")[0] || "User",
    avatar: profile?.avatar_url || null,
  };

  return (
    <div className="h-screen w-full overflow-hidden">
      <MessagesClient currentUser={currentUser} initialRoomId={room} />
    </div>
  );
}
