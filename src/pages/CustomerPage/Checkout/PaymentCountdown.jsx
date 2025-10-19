import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Typography, Progress, message } from "antd";

const { Text } = Typography;

const PaymentCountdown = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const payUrl = searchParams.get("url");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    if (!payUrl) {
      message.error("Không tìm thấy URL thanh toán.");
      navigate("/");
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          message.warning("Hết thời gian thanh toán. Vui lòng tạo đơn hàng mới.");
          navigate("/payment-expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [payUrl, navigate]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percent = (secondsLeft / (15 * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="relative shadow-lg rounded-2xl w-full max-w-4xl text-center p-0 overflow-hidden bg-white">
        {/* --- Overlay countdown --- */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-md z-10">
          <Text strong style={{ fontSize: 20, color: "#ff4d4f" }}>
            ⏳ {minutes}:{seconds.toString().padStart(2, "0")}
          </Text>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor="#ff4d4f"
            trailColor="#f0f0f0"
            size="small"
            style={{ width: 120 }}
          />
        </div>

        {/* --- PayOS iframe --- */}
        <iframe
          title="PayOS Payment"
          src={payUrl}
          style={{
            width: "100%",
            height: "85vh",
            border: "none",
            borderRadius: "12px",
          }}
        />
      </Card>
    </div>
  );
};

export default PaymentCountdown;
