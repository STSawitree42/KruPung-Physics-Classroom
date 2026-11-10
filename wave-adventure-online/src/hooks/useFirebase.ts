import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { onValue, ref, onDisconnect, set, serverTimestamp, remove } from 'firebase/database';
import { fb, isConfigured } from '../config/firebase';
import type { RoomPublic } from '@shared/types';

/** ผู้ใช้ปัจจุบัน + สิทธิ์ครู */
export function useAuthUser() {
  const [state, setState] = useState<{ user: User | null; teacher: boolean; ready: boolean; sid?: string; sname?: string }>({ user: null, teacher: false, ready: !isConfigured });
  useEffect(() => {
    if (!isConfigured) return;
    return onAuthStateChanged(fb().auth, async u => {
      if (!u) return setState({ user: null, teacher: false, ready: true });
      const claims = (await u.getIdTokenResult()).claims;
      setState({ user: u, teacher: claims.teacher === true, ready: true, sid: claims.sid as string | undefined, sname: claims.sname as string | undefined });
    });
  }, []);
  return state;
}

/** สมัครรับสถานะห้องแบบ real-time */
export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!roomId || !isConfigured) return;
    setLoading(true); setError(null);
    return onValue(ref(fb().db, `rooms/${roomId}/public`), s => { setRoom(normalize(s.val())); setLoading(false); }, e => { setError(e.message.includes('permission') ? 'NO_ACCESS' : e.message); setLoading(false); });
  }, [roomId]);
  return { room, error, loading };
}

function normalize(r: RoomPublic | null): RoomPublic | null {
  if (!r) return r;
  r.players = r.players || {}; r.order = r.order || []; r.log = r.log || {};
  Object.values(r.players).forEach(p => { p.stats = p.stats || { correct: 0, partial: 0, wrong: 0, cards: 0, specials: 0 }; });
  if (r.turn?.move) r.turn.move.path = r.turn.move.path || [];
  return r;
}

/** ความต่างเวลาเครื่องกับเซิร์ฟเวอร์ (ใช้นับเวลาถอยหลังให้ตรงกันทุกเครื่อง) */
export function useServerOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!isConfigured) return;
    return onValue(ref(fb().db, '.info/serverTimeOffset'), s => setOffset(Number(s.val()) || 0));
  }, []);
  return offset;
}

/** สถานะการเชื่อมต่อกับ Realtime Database */
export function useConnected() {
  const [connected, setConnected] = useState(true);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    let unsub = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isConfigured) {
      // .info/connected เป็น false ชั่วครู่ตอนเริ่มเชื่อมต่อ จึงรอ 3 วินาทีก่อนแสดงว่าออฟไลน์
      unsub = onValue(ref(fb().db, '.info/connected'), s => {
        clearTimeout(timer);
        if (s.val()) setConnected(true); else timer = setTimeout(() => setConnected(false), 3000);
      });
    }
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearTimeout(timer); unsub(); };
  }, []);
  return online && connected;
}

/** ประกาศว่าเครื่องนี้ออนไลน์อยู่ในห้อง (หายเองเมื่อหลุด) */
export function usePresence(roomId: string | null, uid: string | null) {
  useEffect(() => {
    if (!roomId || !uid || !isConfigured) return;
    const { db } = fb();
    const me = ref(db, `presence/${roomId}/${uid}`);
    const unsub = onValue(ref(db, '.info/connected'), s => {
      if (!s.val()) return;
      onDisconnect(me).remove().then(() => set(me, { online: true, t: serverTimestamp() })).catch(() => {});
    });
    return () => { unsub(); remove(me).catch(() => {}); };
  }, [roomId, uid]);
}

export function usePresenceList(roomId: string | null) {
  const [list, setList] = useState<Record<string, { online: boolean }>>({});
  useEffect(() => {
    if (!roomId || !isConfigured) return;
    return onValue(ref(fb().db, `presence/${roomId}`), s => setList(s.val() || {}), () => setList({}));
  }, [roomId]);
  return list;
}

/** นาฬิกา (re-render ทุก interval ms) */
export function useNow(interval = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]);
  return now;
}

/** ค่าก่อนหน้า */
export function usePrevious<T>(v: T) {
  const r = useRef<T | undefined>(undefined);
  useEffect(() => { r.current = v; }, [v]);
  return r.current;
}
