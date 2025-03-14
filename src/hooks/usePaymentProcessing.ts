import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Session } from "next-auth";
import { useOrderStore } from "@/store/useOrderStore";

// Order 타입 정의
interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  orderType: string;
  status: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentProcessingHookProps {
  session: Session | null;
  createOrder: (order: Order) => void;
  clearTempOrder: () => void;
  refetchOrders: () => Promise<unknown>;
  fetchUserData: () => Promise<void>;
}

interface PaymentData {
  sessionId: string | null;
  paymentSuccess: string | null;
  subscriptionSuccess: string | null;
}

export function usePaymentProcessing({
  session,
  createOrder,
  clearTempOrder,
  refetchOrders,
  fetchUserData,
}: PaymentProcessingHookProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // 이미 처리된 세션인지 확인하기 위한 로컬 스토리지 키 생성 함수
  const getProcessedSessionKey = useCallback((sessionId: string) => {
    return `payment_processed_${sessionId}`;
  }, []);

  // 세션 ID를 이용하여 결제 ID를 가져오는 함수
  const fetchPaymentId = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/payment/session?session_id=${sessionId}`
      );
      const data = await response.json();

      let paymentId = sessionId; // 기본값은 세션 ID

      // payment_id 가져오기 (API에서 결제 유형에 맞는 ID 반환)
      if (data.payment_id) {
        paymentId = data.payment_id;
      } else if (data.payment_intent) {
        // 이전 버전 호환성을 위한 처리
        paymentId = data.payment_intent;
      } else if (data.subscription) {
        // 구독의 경우 subscription ID 사용
        paymentId = data.subscription;
      } else {
        console.warn("결제 ID를 찾을 수 없습니다. 세션 ID를 대신 사용합니다.");
      }

      return { paymentId, mode: data.mode };
    } catch (error) {
      console.error("세션 정보 가져오기 실패:", error);
      return { paymentId: sessionId, mode: null }; // 실패 시 세션 ID 사용
    }
  }, []);

  // 이미 주문이 생성되어 있는지 확인하는 함수
  const checkOrderExists = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/orders/check?session_id=${sessionId}`);
      const data = await response.json();
      return data.exists ? data.order : null;
    } catch (error) {
      console.error("주문 확인 실패:", error);
      return null;
    }
  }, []);

  // 결제 처리 함수
  const processPayment = useCallback(
    async (paymentData: PaymentData) => {
      const { sessionId, paymentSuccess, subscriptionSuccess } = paymentData;

      // 세션 ID가 없으면 처리 중단
      if (!sessionId) {
        console.error("세션 ID가 없어 처리 중단");
        return;
      }

      // 처리 중인지 확인하는 상태 키
      const processingKey = "payment_processing";

      // 이미 처리 중인 경우 중복 실행 방지
      if (localStorage.getItem(processingKey) === "true" || isProcessing) {
        console.log("결제 처리가 이미 진행 중입니다.");
        return;
      }

      // 이미 처리된 세션인지 확인
      const processedKey = getProcessedSessionKey(sessionId);
      if (localStorage.getItem(processedKey)) {
        console.log("이미 처리된 세션입니다:", sessionId);
        return;
      }

      // 처리 시작 표시
      localStorage.setItem(processingKey, "true");
      setIsProcessing(true);

      try {
        console.log("결제 성공 처리 시작...");

        // tempOrder 상태 가져오기
        const orderDetails = useOrderStore.getState().tempOrder;
        console.log("주문 상세 정보:", orderDetails);

        if (!orderDetails) {
          console.error("주문 정보가 없습니다");
          toast.error("주문 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
          localStorage.removeItem(processingKey);
          setIsProcessing(false);
          return;
        }

        // 서버에 이미 주문이 생성되어 있는지 확인
        const existingOrder = await checkOrderExists(sessionId);
        if (existingOrder) {
          console.log("이미 주문이 생성되어 있습니다:", existingOrder);
          localStorage.setItem(processedKey, "true");

          // 임시 주문 정보 삭제
          clearTempOrder();

          // 주문 목록 갱신 및 사용자 정보 다시 가져오기
          await refetchOrders();
          await fetchUserData();

          localStorage.removeItem(processingKey);
          setIsProcessing(false);
          return;
        }

        // 세션 ID로 결제 ID 가져오기
        const { paymentId } = await fetchPaymentId(sessionId);

        // 주문 생성 API 호출
        console.log("주문 생성 중...");
        try {
          // 주문 생성 요청
          createOrder({
            id: "", // 서버에서 생성됨
            userId: session?.user?.id || "",
            productId: orderDetails.productId,
            amount: orderDetails.amount,
            orderType: orderDetails.productType,
            status:
              orderDetails.productType === "one-time"
                ? "completed"
                : "completed_subscription",
            paymentId, // 적절한 결제 ID 사용
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log("주문 생성 요청 완료");

          // 세션 처리 완료 표시 - 중복 처리 방지
          localStorage.setItem(processedKey, "true");

          // 임시 주문 정보 삭제
          clearTempOrder();

          // 주문 목록 갱신 및 사용자 정보 다시 가져오기
          await refetchOrders();
          await fetchUserData();

          // 성공 메시지 표시
          const successMessage =
            paymentSuccess === "true"
              ? "결제가 성공적으로 완료되었습니다."
              : subscriptionSuccess === "true"
              ? "구독이 성공적으로 시작되었습니다."
              : "결제가 성공적으로 처리되었습니다.";

          toast.success(successMessage, {
            position: "top-center",
            autoClose: 3000,
          });
        } catch (error) {
          console.error("주문 생성 실패:", error);
          toast.error(
            "주문 처리 중 오류가 발생했습니다. 관리자에게 문의하세요."
          );
        }
      } catch (error) {
        console.error("결제 처리 오류:", error);
        toast.error("결제 처리 중 오류가 발생했습니다.");
      } finally {
        // 처리 완료 표시
        localStorage.removeItem(processingKey);
        setIsProcessing(false);
      }
    },
    [
      checkOrderExists,
      clearTempOrder,
      createOrder,
      fetchPaymentId,
      fetchUserData,
      getProcessedSessionKey,
      isProcessing,
      refetchOrders,
      session,
    ]
  );

  // URL 파라미터에서 결제 성공 여부를 확인하고 processPayment 함수 호출을 위한 함수
  const handlePaymentSuccess = useCallback(
    (searchParams: URLSearchParams) => {
      const paymentSuccess = searchParams.get("payment_success");
      const subscriptionSuccess = searchParams.get("subscription_success");
      const sessionId = searchParams.get("session_id");

      if (
        (paymentSuccess === "true" || subscriptionSuccess === "true") &&
        sessionId
      ) {
        processPayment({
          sessionId,
          paymentSuccess,
          subscriptionSuccess,
        });

        // URL에서 쿼리 파라미터 제거
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());
      }
    },
    [processPayment]
  );

  return {
    isProcessing,
    processPayment,
    handlePaymentSuccess,
  };
}
