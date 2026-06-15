// задержка, для плавного отображения
const LOADING_DELAY = 2000

export async function loadWithDelay(request) {
  const [requestResult] = await Promise.allSettled([
    request,
    new Promise((resolve) => setTimeout(resolve, LOADING_DELAY)),
  ])

  if (requestResult.status === 'rejected') {
    throw requestResult.reason
  }

  return requestResult.value
}
