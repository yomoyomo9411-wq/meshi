import { Sprout, Star, Milestone, Trophy, Crown, Sparkles } from "lucide-react";

export const TROPHY_LIST = [
  { id: "1", threshold: 1, label: "星の種火", description: "最初の1人と繋がった", icon: Sprout, color: "#4ade80" }, // 優しい緑
  { id: "2", threshold: 3, label: "小さな三連星", description: "3人の星座を作った", icon: Star, color: "#60a5fa" }, // 澄んだ青
  { id: "3", threshold: 10, label: "銀河の観測者", description: "10人の星々を見つけた", icon: Milestone, color: "#c084fc" }, // 幻想的な紫
  { id: "4", threshold: 30, label: "星座の開拓者", description: "30人の歴史を刻んだ", icon: Trophy, color: "#f87171" }, // 情熱の赤
  { id: "5", threshold: 50, label: "星系を統べる者", description: "50人の絆を束ねた", icon: Crown, color: "#fb923c" }, // 輝くオレンジ
  { id: "6", threshold: 100, label: "宇宙の創造主", description: "100人の銀河を創り出した", icon: Sparkles, color: "#facc15" }, // 究極の金
];