// Rota legada — use /[tenant]/pedido?id=X
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function getStaticPaths() {
  return { paths: [], fallback: false };
}
export function getStaticProps() {
  return { props: {} };
}

export default function PedidoLegacyRedirect() {
  const { query, replace } = useRouter();
  useEffect(() => {
    if (query.tenant && query.id) {
      replace(`/${query.tenant}/pedido?id=${query.id}`);
    }
  }, [query, replace]);
  return null;
}
