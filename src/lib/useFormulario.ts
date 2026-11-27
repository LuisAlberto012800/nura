"use client";

import { useActionState, useTransition, type FormEvent } from "react";

// Envía un formulario a una acción del servidor sin que React lo reinicie al
// terminar. Con <form action={...}> React borra lo escrito después de cada
// envío, incluso cuando la acción regresa un error, y los interruptores y
// listas vuelven a como estaban al abrir la pantalla.
export function useFormulario<S>(accion: (estado: Awaited<S>, datos: FormData) => S | Promise<S>, inicial: Awaited<S>) {
  const [estado, despachar, pendiente] = useActionState<S, FormData>(accion, inicial);
  const [enTransicion, iniciar] = useTransition();
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    iniciar(() => despachar(datos));
  };
  return { estado, enviar, enviando: pendiente || enTransicion };
}
