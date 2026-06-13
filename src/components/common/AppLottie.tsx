import Lottie, { type LottieComponentProps } from 'lottie-react'

type AppLottieProps = Omit<LottieComponentProps, 'animationData'> & {
  animationData: object
  width?: number
  height?: number
}

export function AppLottie({
  animationData,
  width,
  height,
  style,
  className,
  loop = false,
  ...rest
}: AppLottieProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      className={className}
      style={{ width, height, ...style }}
      {...rest}
    />
  )
}
