import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: role, error: roleError } =
    await supabase.rpc("get_my_role");

  if (roleError || role !== "admin") {
    redirect("/admin/login?verify=1");
  }

  return <AdminPanel />;
}
