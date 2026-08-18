
import confetti from 'canvas-confetti'

export const useConfetti = () => {
  const triggerConfetti = (options = {}) => {
    const defaultOptions = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    }
    confetti({ ...defaultOptions, ...options })
  }

  return { triggerConfetti }
}
