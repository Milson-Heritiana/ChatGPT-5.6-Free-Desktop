import './globals.css'

export const metadata = {
  title: 'VOID Gallery',
  description: 'Dark Archive — Curated Visual Experience',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
