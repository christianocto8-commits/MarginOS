import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-700 border border-emerald-500/30">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-100">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-400">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link href="/" className="inline-block pt-2">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
            Kembali ke Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
