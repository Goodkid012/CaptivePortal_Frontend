import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ulwembu connect logo.jpeg";
import Cwt from "../../assets/cwt.png";
import { BASE_URL } from "../../api/api";

/* ==============================
   GOOGLE AD COMPONENT
============================== */
function GoogleAd({ onFail }) {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      onFail();
    }

    const timeout = setTimeout(() => {
      if (!adRef.current || adRef.current.innerHTML.trim() === "") {
        onFail();
      }
    }, 2500); // fallback after 2.5s

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ display: "block", width: 300, height: 250 }}
      data-ad-client="ca-pub-XXXXXXXXXXXX" // 🔴 replace
      data-ad-slot="YYYYYYYYYY"             // 🔴 replace
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

/* ==============================
   MAIN AD PAGE
============================== */
export default function Ad() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [selectedAd, setSelectedAd] = useState(null);
  const [useGoogleAds, setUseGoogleAds] = useState(true);

  const redirectToUlwembu = () => {
    window.location.href =
      selectedAd?.redirectUrl || "https://www.ulwembubs.com/";
  };

  /* ==============================
     FETCH BACKEND ADS
  ============================== */
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`${BASE_URL}/advertisements`);
        if (!res.ok) throw new Error("Failed to fetch ads");

        const data = await res.json();
        if (data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setSelectedAd(data[randomIndex]);
        }
      } catch (error) {
        console.error("fetch error:", error);
      }
    };

    fetchAds();
  }, []);

  /* ==============================
     IMPRESSION TRACKING
  ============================== */
  useEffect(() => {
    if (!selectedAd) return;

    const userId = sessionStorage.getItem("userId");

    const recordImpression = async (watchTime, click = false) => {
      try {
        await fetch(`${BASE_URL}/impressions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            impression: { watchTime, click },
            customerId: userId,
            advertisementId: selectedAd.id,
          }),
        });
      } catch (error) {
        console.error("Impression post error:", error);
      }
    };

    const vid = videoRef.current;
    if (!vid) return;

    const handleEnded = async () => {
      const duration = Math.floor(vid.duration * 1000);
      await recordImpression(duration, false);
      redirectToUlwembu();
    };

    vid.addEventListener("ended", handleEnded);
    return () => vid.removeEventListener("ended", handleEnded);
  }, [selectedAd]);

  /* ==============================
     CLICK TRACKING
  ============================== */
  const handleAdClick = async () => {
    if (!selectedAd) return;

    const userId = sessionStorage.getItem("userId");
    try {
      await fetch(`${BASE_URL}/impressions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          impression: { watchTime: 0, click: true },
          customerId: userId,
          advertisementId: selectedAd.id,
        }),
      });
    } catch (error) {
      console.error("Click tracking failed:", error);
    }

    redirectToUlwembu();
  };

  if (!selectedAd && !useGoogleAds) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading advertisement...
      </div>
    );
  }

  const isVideo =
    selectedAd?.mediaUrl?.match(/\.(mp4|mov|avi|mkv)$/i);
  const isImage =
    selectedAd?.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  /* ==============================
     UI
  ============================== */
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-tl from-blue-500 to-green-400">
      {/* LEFT PANEL */}
      <div className="text-white flex flex-col justify-between p-6 md:p-10 relative">
        <div className="flex justify-center mb-6 mt-20 lg:mt-32 md:mt-10">
          <img
            src={logo}
            alt="Ulwembu Connect Logo"
            className="w-20 h-20 md:w-24 md:h-24 rounded-xl shadow-lg bg-white p-2 md:p-3"
          />
        </div>

        <div className="flex flex-col items-center text-center space-y-4 z-10">
          <h1 className="text-2xl font-bold">
            You’ve successfully logged in
          </h1>
          <p className="text-sm opacity-90">
            You will be redirected after the ad...
          </p>
        </div>

        <div className="absolute bottom-0 left-0 opacity-20 z-0 hidden md:block">
          <img src={Cwt} alt="CWT Background" className="w-screen h-80" />
        </div>

        <div className="flex justify-center md:hidden w-screen z-0">
          <img
            src={Cwt}
            alt="City WiFi"
            className="w-screen max-h-40 object-cover opacity-30 -ml-12"
          />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="p-6 md:p-10 bg-white rounded-tl-[50px] md:rounded-tl-none -mt-12 z-10 flex flex-col items-center justify-center space-y-6">

        {/* GOOGLE ADS FIRST */}
        {useGoogleAds ? (
          <GoogleAd onFail={() => setUseGoogleAds(false)} />
        ) : (
          <>
            {isVideo ? (
              <video
                ref={videoRef}
                src={selectedAd.mediaUrl}
                autoPlay
                muted
                controls
                onClick={handleAdClick}
                className="rounded-2xl shadow-lg w-72 max-w-md cursor-pointer"
              />
            ) : isImage ? (
              <img
                src={selectedAd.mediaUrl}
                alt={selectedAd.advertismentTitle}
                onClick={handleAdClick}
                className="rounded-2xl shadow-lg w-72 max-w-md cursor-pointer"
              />
            ) : (
              <div
                className="rounded-2xl shadow-lg bg-gray-100 w-72 h-44 flex items-center justify-center text-gray-500 cursor-pointer"
                onClick={handleAdClick}
              >
                Unsupported media type
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate("/plans")}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-green-400 text-white font-semibold shadow-md hover:opacity-90 transition"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
