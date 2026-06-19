"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { holdSeatsAction } from "@/app/[locale]/shows/[id]/seats/actions";
import { HALL_CONFIG, seatId, type TierId } from "@/lib/hall-config";
import { type PositionedSeat } from "@/lib/hall-layout";
import { type AppLocale } from "@/lib/format";
import { HallOverview } from "./HallOverview";
import { ZoneDetail } from "./ZoneDetail";
import { SelectionBar } from "./SelectionBar";

const MAX_SEATS = 10;

type View = { mode: "overview" } | { mode: "zone"; zoneId: string };

type SeatSelectionViewProps = {
  showId: string;
  positionedSeats: PositionedSeat[];
  unavailableSeatIds: string[];
  tierPrices: Record<TierId, number>;
  locale: AppLocale;
};

export function SeatSelectionView({
  showId,
  positionedSeats,
  unavailableSeatIds,
  tierPrices,
  locale,
}: SeatSelectionViewProps) {
  const t = useTranslations("seats");
  const [view, setView] = useState<View>({ mode: "overview" });
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const occupied = useMemo(
    () => new Set(unavailableSeatIds),
    [unavailableSeatIds],
  );

  const seatById = useMemo(() => {
    const map = new Map<string, PositionedSeat>();
    for (const s of positionedSeats) {
      map.set(seatId(s.zoneId, s.row, s.seat), s);
    }
    return map;
  }, [positionedSeats]);

  const seatsByZone = useMemo(() => {
    const map = new Map<string, PositionedSeat[]>();
    for (const s of positionedSeats) {
      const arr = map.get(s.zoneId);
      if (arr) arr.push(s);
      else map.set(s.zoneId, [s]);
    }
    return map;
  }, [positionedSeats]);

  const handleSeatToggle = (id: string) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_SEATS) {
        setError(t("errorMaxSeats"));
        return prev;
      }
      next.add(id);
      return next;
    });
  };

  const selectedList = useMemo(() => {
    const arr: Array<{
      id: string;
      zoneName: string;
      zoneId: string;
      row: number;
      seat: number;
      price: number;
    }> = [];
    for (const id of selected) {
      const pos = seatById.get(id);
      if (!pos) continue;
      const zone = HALL_CONFIG.find((z) => z.id === pos.zoneId);
      arr.push({
        id,
        zoneId: pos.zoneId,
        zoneName: zone?.name[locale] ?? pos.zoneId,
        row: pos.row,
        seat: pos.seat,
        price: tierPrices[pos.tier],
      });
    }
    return arr;
  }, [selected, seatById, locale, tierPrices]);

  const totalPrice = selectedList.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    if (selectedList.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await holdSeatsAction({
        showId,
        locale,
        seats: selectedList.map((s) => ({
          zoneId: s.zoneId,
          row: s.row,
          seat: s.seat,
        })),
      });
      // Success path: the action redirects and this code never runs.
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {view.mode === "overview" ? (
        <HallOverview
          onZoneClick={(zoneId) => setView({ mode: "zone", zoneId })}
          tierPrices={tierPrices}
          locale={locale}
        />
      ) : (
        <ZoneDetail
          zoneId={view.zoneId}
          seats={seatsByZone.get(view.zoneId) ?? []}
          occupied={occupied}
          selected={selected}
          onSeatToggle={handleSeatToggle}
          onBack={() => setView({ mode: "overview" })}
          tierPrices={tierPrices}
          locale={locale}
        />
      )}

      <SelectionBar
        selectedCount={selectedList.length}
        totalPrice={totalPrice}
        seats={selectedList.map((s) => ({
          zoneName: s.zoneName,
          row: s.row,
          seat: s.seat,
        }))}
        onContinue={handleContinue}
        isPending={isPending}
        error={error}
        locale={locale}
      />
    </>
  );
}
