import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

function Number({ mv, number, height }: { mv: any; number: number; height: number }) {
  const y = useTransform(mv, (latest: number) => {
    const placeValue = latest % 10
    const offset = (10 + number - placeValue) % 10
    let memo = offset * height
    if (offset > 5) {
      memo -= 10 * height
    }
    return memo
  })
  
  return (
    <motion.span className="absolute inset-0 flex items-center justify-center" style={{ y }}>
      {number}
    </motion.span>
  )
}

function Digit({ place, value, height }: { place: number; value: number; height: number }) {
  const valueRoundedToPlace = Math.floor(value / place)
  const animatedValue = useSpring(valueRoundedToPlace)
  
  useEffect(() => {
    animatedValue.set(valueRoundedToPlace)
  }, [animatedValue, valueRoundedToPlace])
  
  return (
    <div className="relative w-4 overflow-hidden" style={{ height }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  )
}

type AnimatedCounterProps = {
  value: number
  fontSize?: number
  textColor?: string
  fontWeight?: string
}

export default function AnimatedCounter({
  value,
  fontSize = 16,
  textColor = "white",
  fontWeight = "bold"
}: AnimatedCounterProps) {
  const height = fontSize + 4
  const places = value >= 100 ? [100, 10, 1] : value >= 10 ? [10, 1] : [1]
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-lg">🔥</span>
      <div 
        className="flex overflow-hidden"
        style={{ 
          fontSize, 
          color: textColor, 
          fontWeight,
          height
        }}
      >
        {places.map((place) => (
          <Digit
            key={place}
            place={place}
            value={value}
            height={height}
          />
        ))}
      </div>
    </div>
  )
}
