import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnvInfo() {
      try {
        const response = await fetch("/api/debug");
        if (response.ok) {
          const data = await response.json();
          setEnvVars(data.env);
        }
      } catch (error) {
        console.error("환경 변수 정보를 가져오는 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEnvInfo();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">디버깅 페이지</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">세션 정보</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify({ status, session }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">환경 변수 정보</h2>
        {loading ? (
          <p>환경 변수 정보를 가져오는 중...</p>
        ) : (
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">현재 URL 정보</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <p>
            <strong>window.location.href:</strong>{" "}
            {typeof window !== "undefined"
              ? window.location.href
              : "N/A (서버 렌더링 중)"}
          </p>
          <p>
            <strong>window.location.origin:</strong>{" "}
            {typeof window !== "undefined"
              ? window.location.origin
              : "N/A (서버 렌더링 중)"}
          </p>
          <p>
            <strong>window.location.host:</strong>{" "}
            {typeof window !== "undefined"
              ? window.location.host
              : "N/A (서버 렌더링 중)"}
          </p>
        </div>
      </div>
    </div>
  );
}
