import Builder from "@/features/workflows/builder";
export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  return <Builder identifier={id} />;
}
