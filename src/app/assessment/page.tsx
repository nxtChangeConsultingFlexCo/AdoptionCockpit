import { createClient } from "@/lib/supabase/server";
import { AssessmentFlow } from "@/components/assessment/assessment-flow";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <AssessmentFlow isAuthenticated={Boolean(user)} />
      </div>
    </div>
  );
}
