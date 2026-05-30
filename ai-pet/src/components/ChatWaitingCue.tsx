import { useEffect, useRef, useState } from "react";

const PET_CARE_TIPS = [
  "换粮要慢慢过渡 7 天，先少量混入新粮。",
  "饮水突然变多或变少，都值得记录下来观察。",
  "抓挠变频繁时，先看耳朵、腋下和腹部有没有发红。",
  "散步回家后擦脚垫，能减少舔脚和皮肤刺激。",
  "零食最好算进每日热量，不要替代正餐。",
  "突然不爱玩不一定是懒，可能是疼痛或精力不足。",
  "毛发打结先用手分开，再用梳子轻轻梳通。",
  "洗澡别太频繁，皮肤敏感时先问医生更稳妥。",
  "新玩具先陪着玩几分钟，确认不会误吞小部件。",
  "便便颜色、形状和频率，是很重要的健康线索。",
  "出门前确认牵引、铭牌和水，长时间外出要带补给。",
  "高温天气别让狗狗长时间踩烫地面。",
  "猫砂盆突然不用，常常比调皮更值得排查。",
  "老年宠物上下沙发吃力时，可以加一个低矮台阶。",
  "清洁耳朵不要深入耳道，外耳廓轻擦就够。",
  "体重每周记一次，比偶尔目测更可靠。"
];

type TickerPhase = "typing" | "holding" | "backspacing";

const TYPING_BASE_MS = 36;
const TYPING_JITTER_MS = 24;
const HOLD_MS = 2100;
const BACKSPACE_BASE_MS = 20;
const BACKSPACE_JITTER_MS = 12;

function randomTipIndex(exclude?: number) {
  if (PET_CARE_TIPS.length <= 1) return 0;
  let next = Math.floor(Math.random() * PET_CARE_TIPS.length);
  while (next === exclude) {
    next = Math.floor(Math.random() * PET_CARE_TIPS.length);
  }
  return next;
}

function usePetCareTicker() {
  const [phase, setPhase] = useState<TickerPhase>("typing");
  const [tipIndex, setTipIndex] = useState(() => randomTipIndex());
  const [text, setText] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tip = PET_CARE_TIPS[tipIndex] || PET_CARE_TIPS[0];
    if (!tip) return;

    if (phase === "typing") {
      if (text.length < tip.length) {
        timerRef.current = setTimeout(() => {
          setText(tip.slice(0, text.length + 1));
        }, TYPING_BASE_MS + Math.random() * TYPING_JITTER_MS);
      } else {
        setPhase("holding");
      }
    }

    if (phase === "holding") {
      timerRef.current = setTimeout(() => {
        setPhase("backspacing");
      }, HOLD_MS);
    }

    if (phase === "backspacing") {
      if (text.length > 0) {
        timerRef.current = setTimeout(() => {
          setText(text.slice(0, -1));
        }, BACKSPACE_BASE_MS + Math.random() * BACKSPACE_JITTER_MS);
      } else {
        setTipIndex((current) => randomTipIndex(current));
        setPhase("typing");
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, text, tipIndex]);

  return { text, showCursor: phase === "typing" || phase === "holding" };
}

export function ChatWaitingCue({ petName }: { petName: string }) {
  const { text, showCursor } = usePetCareTicker();

  return (
    <div className="chat-waiting-cue" aria-label={`${petName}正在思考`} aria-live="polite">
      <div className="waiting-dot-bubble" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="pet-care-ticker">
        <span>{text}</span>
        {showCursor ? <i aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
