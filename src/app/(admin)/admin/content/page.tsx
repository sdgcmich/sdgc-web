import { AdminContent } from "@/features/admin/components/admin-content";
import { getAdminPages } from "@/features/admin/queries";
import {
  getHomePageContent,
  getAboutPageContent,
  getGardenWalkPageContent,
  getJoinPageContent,
} from "@/features/content/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Pages & Site Copy",
};

export default async function AdminContentPage() {
  await requireCapability("content.manage", "/admin/content");
  const [pages, homeContent, aboutContent, gardenWalkContent, joinContent] = await Promise.all([
    getAdminPages(),
    getHomePageContent(),
    getAboutPageContent(),
    getGardenWalkPageContent(),
    getJoinPageContent(),
  ]);

  return (
    <AdminContent
      initialPages={pages}
      initialHomeContent={homeContent}
      initialAboutContent={aboutContent}
      initialGardenWalkContent={gardenWalkContent}
      initialJoinContent={joinContent}
    />
  );
}
