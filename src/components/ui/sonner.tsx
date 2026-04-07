"use client";

import type * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  return <SonnerToaster position="top-right" richColors closeButton {...props} />;
};

export { Toaster };
