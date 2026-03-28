function Spinner({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400">{text}</p>
    </div>
  )
}

export default Spinner
