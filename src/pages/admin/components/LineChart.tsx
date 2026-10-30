import { Box } from '@chakra-ui/react'

type Props = {
  values: number[]
  labels?: string[]
  max?: number
  fill?: boolean
}

export default function LineChart({
  values,
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  max = 60000,
  fill = false
}: Props) {
  const width = 700
  const height = 280
  const px = 50
  const py = 30
  const chartWidth = width - px * 2
  const chartHeight = height - py * 2

  const points = values.map((value, index) => ({
    x: px + (index / (values.length - 1)) * chartWidth,
    y: py + chartHeight - (value / max) * chartHeight
  }))

  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const area = `${line} L ${last.x} ${height - py} L ${first.x} ${height - py} Z`

  return (
    <Box overflowX="auto">
      <Box as="svg" width="100%" minW="600px" viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = py + chartHeight - ratio * chartHeight
          return (
            <g key={ratio}>
              <line x1={px} y1={y} x2={width - px} y2={y} stroke="#ddd" strokeDasharray="4 4" />
              <text x={px - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#777">
                {Math.round(max * ratio)}
              </text>
            </g>
          )
        })}

        {points.map((point, index) => (
          <g key={labels[index]}>
            <line x1={point.x} y1={py} x2={point.x} y2={height - py} stroke="#eee" strokeDasharray="4 4" />
            <text x={point.x} y={height - 7} textAnchor="middle" fontSize="11" fill="#777">
              {labels[index]}
            </text>
          </g>
        ))}

        {fill && <path d={area} fill="rgba(23,101,38,.18)" />}
        <path d={line} fill="none" stroke="#176526" strokeWidth="2" />
        {!fill && points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill="white" stroke="#176526" strokeWidth="2" />
        ))}
      </Box>
    </Box>
  )
}
