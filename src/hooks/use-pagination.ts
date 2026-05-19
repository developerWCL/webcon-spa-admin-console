"use client";

import { useState, useCallback } from "react";
import { PaginationMeta } from "@/components/pagination";

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export interface UsePaginationReturn {
  currentPage: number;
  limit: number;
  setCurrentPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  getPaginationParams: () => { page: number; limit: number };
}

/**
 * Hook to manage pagination state
 *
 * @example
 * const { currentPage, limit, setCurrentPage, setLimit, getPaginationParams } = usePagination();
 *
 * // Use in API call
 * const params = getPaginationParams(); // { page: 1, limit: 10 }
 * const result = await getStaffMembers(branchId, params.page, params.limit);
 */
export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 10,
    onPageChange,
    onLimitChange,
  } = options;

  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const setCurrentPage = useCallback(
    (page: number) => {
      // Ensure page is at least 1
      const validPage = Math.max(1, page);
      setCurrentPageState(validPage);
      onPageChange?.(validPage);
    },
    [onPageChange],
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      // Ensure limit is at least 1
      const validLimit = Math.max(1, newLimit);
      setLimitState(validLimit);
      // Reset to first page when limit changes
      setCurrentPageState(1);
      onLimitChange?.(validLimit);
    },
    [onLimitChange],
  );

  const resetPagination = useCallback(() => {
    setCurrentPageState(initialPage);
    setLimitState(initialLimit);
  }, [initialPage, initialLimit]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage, setCurrentPage]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const getPaginationParams = useCallback(
    () => ({
      page: currentPage,
      limit,
    }),
    [currentPage, limit],
  );

  return {
    currentPage,
    limit,
    setCurrentPage,
    setLimit,
    resetPagination,
    goToNextPage,
    goToPreviousPage,
    getPaginationParams,
  };
}
