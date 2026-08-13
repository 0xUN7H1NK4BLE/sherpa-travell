"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import { isWebGLAvailable } from "./webglSupport";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Scene3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function Scene3DBoundary({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setMounted(true);
    setWebglOk(isWebGLAvailable());
  }, []);

  if (!mounted || !webglOk) return <>{fallback}</>;

  return <Scene3DErrorBoundary fallback={fallback}>{children}</Scene3DErrorBoundary>;
}
