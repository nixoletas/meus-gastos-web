import { redirect } from 'next/navigation';

/** "Gráficos" virou "Visualizar": favoritos antigos continuam funcionando. */
export default function GraficosPage() {
  redirect('/visualizar');
}
