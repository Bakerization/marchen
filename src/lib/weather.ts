/**
 * Weather alert integration using OpenWeatherMap API.
 */

interface WeatherForecast {
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  temperature?: number;
  precipitationProbability?: number;
}

export const checkWeather = async (
  lat: number,
  lng: number,
  date: Date,
): Promise<WeatherForecast> => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    console.warn("[weather] OPENWEATHERMAP_API_KEY not set");
    return {
      summary: "天気情報を取得できません（API未設定）",
      riskLevel: "LOW",
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Weather API error: ${res.status}`);
    }

    const data = await res.json();
    const targetDate = date.toISOString().slice(0, 10);

    // Find forecast entries for the target date
    const dayForecasts = data.list?.filter((item: { dt_txt: string }) =>
      item.dt_txt.startsWith(targetDate),
    ) ?? [];

    if (dayForecasts.length === 0) {
      return {
        summary: "予報期間外です",
        riskLevel: "LOW",
      };
    }

    // Calculate max precipitation probability and avg temp
    let maxPop = 0;
    let totalTemp = 0;

    for (const f of dayForecasts) {
      const pop = (f.pop ?? 0) * 100;
      if (pop > maxPop) maxPop = pop;
      totalTemp += f.main?.temp ?? 0;
    }

    const avgTemp = totalTemp / dayForecasts.length;
    const mainWeather = dayForecasts[0]?.weather?.[0]?.description ?? "不明";

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (maxPop > 70) riskLevel = "HIGH";
    else if (maxPop > 40) riskLevel = "MEDIUM";

    return {
      summary: `${mainWeather}（降水確率: 最大${Math.round(maxPop)}%, 気温: 約${Math.round(avgTemp)}°C）`,
      riskLevel,
      temperature: Math.round(avgTemp),
      precipitationProbability: Math.round(maxPop),
    };
  } catch (err) {
    console.error("[weather] Failed to fetch weather:", err);
    return {
      summary: "天気情報の取得に失敗しました",
      riskLevel: "LOW",
    };
  }
};
