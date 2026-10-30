import { Box } from "@chakra-ui/react";

type Props = {
  zIndex?: number;     // stacking layer (keep low so section canopies sit above)
  intensity?: number;  // 0..1  scales overall brightness
  showNebulas?: boolean;
};

export default function DotField({
  zIndex = 0,
  intensity = 1,
  showNebulas = true,
}: Props) {
  // scale opacities from a single knob
  const neb = 0.65 * intensity;
 
  const smallStars = 0.30 * intensity;
  const brightStars = 0.85 * intensity;

  return (
    <Box position="fixed" inset={0} pointerEvents="none" zIndex={zIndex}>
      {/* --- Purple nebulas (big / medium / small) --- */}
      {showNebulas && (
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          // "screen" lets purple glow lift the dark background without crushing content
          mixBlendMode="screen"
          opacity={neb}
          // multiple soft radial gradients placed around the viewport
          bgImage={`
            radial-gradient(440px 360px at 70% 60%, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.10) 40%, rgba(139,92,246,0) 70%),
            radial-gradient(220px 220px at 15% 12%, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0) 60%),
            radial-gradient(160px 160px at 34% 30%, rgba(168,85,247,0.30) 0%, rgba(168,85,247,0) 60%),
            radial-gradient(200px 200px at 84% 26%, rgba(168,85,247,0.30) 0%, rgba(168,85,247,0) 60%),
            radial-gradient(180px 180px at 18% 66%, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0) 60%),
            radial-gradient(220px 220px at 50% 88%, rgba(168,85,247,0.32) 0%, rgba(168,85,247,0) 60%)
          `}
          bgRepeat="no-repeat"
          // heavy blur to get the velvety “nebula” look
          filter="blur(22px)"
        />
      )}

      {/* LARGE dots */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={1}
        pointerEvents="none"
        mixBlendMode="screen"
        opacity={0.65}
        bgImage={`
          radial-gradient(28px 28px at 12% 22%, rgba(255,255,255,0.24) 0, rgba(255,255,255,0) 60%),
          radial-gradient(26px 26px at 46% 10%, rgba(255,255,255,0.24) 0, rgba(255,255,255,0) 60%),
          radial-gradient(28px 28px at 88% 36%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(28px 28px at 20% 78%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(26px 26px at 72% 80%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%)
        `}
        bgRepeat="no-repeat"
      />

            {/* LARGE dots */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={1}
        pointerEvents="none"
        mixBlendMode="screen"
        opacity={0.65}
        bgImage={`
          
          radial-gradient(28px 28px at 80% 48%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(26px 26px at 20% 40%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%)

        `}
        bgRepeat="no-repeat"
      />

         <Box
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={1}
        pointerEvents="none"
        mixBlendMode="screen"
        opacity={0.65}
        bgImage={`
          
          radial-gradient(28px 28px at 60% 58%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(26px 26px at 30% 30%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%)

        `}
        bgRepeat="no-repeat"
      />
      {/* MEDIUM dots */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={1}
        pointerEvents="none"
        mixBlendMode="screen"
        opacity={0.5}
        bgImage={`
          radial-gradient(18px 18px at 33% 14%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(18px 18px at 55% 28%, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 60%),
          radial-gradient(18px 18px at 74% 20%, rgba(255,255,255,0.20) 0, rgba(255,255,255,0) 60%),
          radial-gradient(18px 18px at 60% 52%, rgba(255,255,255,0.20) 0, rgba(255,255,255,0) 60%)
        `}
        bgRepeat="no-repeat"
      />
      {/* --- Small scattered stars (fainter) --- */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        mixBlendMode="screen"
        opacity={smallStars}
        bgImage={`
          radial-gradient(2px 2px at 6% 42%, rgba(255,255,255,0.65) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 28% 18%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 38% 62%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 62% 22%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 78% 48%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 90% 34%, rgba(255,255,255,0.50) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 16% 78%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 44% 86%, rgba(255,255,255,0.50) 0, rgba(255,255,255,0) 60%),
          radial-gradient(2px 2px at 68% 82%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 60%)
        `}
        bgRepeat="no-repeat"
      />

      {/* --- Bright stars / glints (a few bigger points) --- */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        mixBlendMode="screen"
        opacity={brightStars}
        bgImage={`
          radial-gradient(3px 3px at 22% 38%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 70%),
          radial-gradient(3px 3px at 31% 41%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 70%),
          radial-gradient(3px 3px at 66% 33%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 70%),
          radial-gradient(3px 3px at 84% 72%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 70%),
          radial-gradient(3px 3px at 12% 60%, rgba(255,255,255,0.9) 0, rgba(255,255,255,0) 70%)
        `}
        bgRepeat="no-repeat"
        // a touch of blur softens the edges like your reference
        filter="blur(0.2px)"
      />

       <Box
        aria-hidden
        position="absolute"
        inset={0}
        zIndex={1}
        opacity={0.28}
        mixBlendMode="screen"
        bgImage={`
          radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.2px),
          radial-gradient(rgba(255,255,255,0.22) 1.2px, transparent 1.2px)
        `}
        bgSize="72px 72px, 48px 48px"
        bgPos="0 0, 24px 24px"
      />
    </Box>
  );
}
