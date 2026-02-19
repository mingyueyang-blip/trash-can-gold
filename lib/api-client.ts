/**
 * 前端调用 /api 的封装（需 NEXT_PUBLIC_API_KEY）
 */
const API_KEY = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_KEY : "";

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) (h as Record<string, string>)["X-API-KEY"] = API_KEY;
  return h;
}

export async function captureApi(payload: { type: "text" | "link"; content: string }) {
  const res = await fetch("/api/capture", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "请求失败");
  return data as {
    fragmentId: string;
    suggestedTags: { id: string; name: string }[];
    warning?: string;
  };
}

export async function listFragmentsApi(params?: { q?: string; status?: string }) {
  const url = new URL("/api/fragments", typeof window !== "undefined" ? window.location.origin : "");
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.status) url.searchParams.set("status", params.status);
  const res = await fetch(url.toString(), { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "请求失败");
  return data as Array<{
    id: string;
    content: string;
    sourceType: string;
    sourceUrl: string | null;
    tagIds: string[];
    status: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function deleteFragmentApi(id: string): Promise<void> {
  const res = await fetch(`/api/fragments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "删除失败");
}

export async function updateFragmentStatusApi(
  id: string,
  status: "inbox" | "archived" | "burned"
): Promise<void> {
  const res = await fetch(`/api/fragments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "更新失败");
}
