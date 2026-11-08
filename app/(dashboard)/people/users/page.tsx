import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Lock, Pencil, Plus, UserCog } from "lucide-react";

import { NoPermission } from "@/components/form/FormPageHead";
import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { auth } from "@/auth";
import { thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import { listUsers, type UserRow } from "@/lib/users";
import { deleteUser } from "./actions";
import "@/components/list/list.css";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "ผู้ใช้งาน" };

const BASE_PATH = "/people/users";
const TONES = new Set(["navy", "info", "success", "warning", "neutral", "danger", "gold"]);

/** First letter for an avatar, skipping Thai leading vowels (design: D.ch). */
const firstLetter = (s: string) => s.replace(/^[เ-ไ]/, "").charAt(0);

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">ผู้ใช้งาน</h1>
        <p className="gg-pagehead-sub">{summary ?? "พนักงานที่เข้าใช้ระบบ"}</p>
      </div>
    </div>
  );
}

function Row({ u, isSelf }: { u: UserRow; isSelf: boolean }) {
  const name = `${u.firstName} ${u.lastName}`;
  const tone = TONES.has(u.roleRef.tone) ? u.roleRef.tone : "neutral";
  return (
    <tr>
      <td>
        <div className="who">
          <span className="gg-avatar" aria-hidden="true">
            {u.image ? (
              <Image src={u.image} alt="" width={38} height={38} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (firstLetter(u.firstName) + firstLetter(u.lastName)).toUpperCase()
            )}
          </span>
          <div>
            <span className="n">
              {name}
              {isSelf && <span className="gg-badge neutral tag-default">คุณ</span>}
            </span>
            <span className="sub">{u.email}</span>
          </div>
        </div>
      </td>
      <td><span className={`gg-badge ${tone}`}>{u.roleRef.name}</span></td>
      <td>{u.phoneNumber ?? <span className="sub">—</span>}</td>
      <td className="created">
        {thaiDate(u.createdAt)}
        <span>{thaiTime(u.createdAt)}</span>
      </td>
      <td className="gg-actions-cell right">
        <div className="row-actions">
          <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${u.id}/edit`} aria-label={`แก้ไข ${name}`} title="แก้ไข">
            <Pencil className="gg-icon sm" aria-hidden />
          </Link>
          {isSelf ? (
            // You can't delete your own account (deleteUser refuses too), so show why instead.
            <span className="gg-btn gg-btn-ghost sm icon-only row-locked" role="img" aria-label="ไม่สามารถลบบัญชีของตัวเองได้" title="ไม่สามารถลบบัญชีของตัวเองได้">
              <Lock className="gg-icon sm" aria-hidden />
            </span>
          ) : (
            // The last-admin rule is checked on the server and explained in a toast.
            <DeleteRecordButton id={u.id} name={name} noun="ผู้ใช้งาน" action={deleteUser} />
          )}
        </div>
      </td>
    </tr>
  );
}

async function UserList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  // Staff accounts hold personal data, so the whole list needs Manage Users (admins),
  // unlike the customer and supplier lists, which every signed-in user can view.
  const [canManage, session] = await Promise.all([can("users.manage"), auth()]);
  if (!canManage) {
    return (
      <>
        <PageHead />
        <div className="lts-form"><NoPermission noun="ผู้ใช้งาน" /></div>
      </>
    );
  }

  const { q, page, size } = parseListParams(await searchParams);
  const list = await listUsers({ q, page, size });

  return (
    <>
      <PageHead summary={`พนักงานที่เข้าใช้ระบบ · ${list.totalActive} คน`} />
      <div className="gg-table-card">
        {/* No Import button for users (unlike customers and suppliers). */}
        <div className="gg-table-toolbar">
          <ListSearch basePath={BASE_PATH} q={q} size={size} placeholder="ค้นหาด้วยชื่อ อีเมล หรือบทบาท" label="ค้นหาผู้ใช้งาน" />
          <div className="gg-row">
            <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
              <Plus className="gg-icon" aria-hidden />
              เพิ่มผู้ใช้งาน
            </Link>
          </div>
        </div>

        <div className="gg-table-wrap pp-table">
          <table className="gg-table">
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>บทบาท</th>
                <th>เบอร์โทรศัพท์</th>
                <th>วันที่สร้าง</th>
                <th className="gg-actions-cell right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((u) => (
                <Row key={u.id} u={u} isSelf={u.id === session?.user?.id} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><UserCog className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีผู้ใช้งาน</b>
                        <span>เพิ่มบัญชีให้พนักงานเข้าใช้ระบบตามบทบาทที่กำหนด</span>
                        <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                          <Plus className="gg-icon" aria-hidden />
                          เพิ่มผู้ใช้งาน
                        </Link>
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบผู้ใช้งานที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยชื่อ อีเมล เบอร์โทร หรือบทบาทอื่น</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ListPager basePath={BASE_PATH} q={q} size={size} page={list.page} pages={list.pages} total={list.total} />
      </div>
    </>
  );
}

/** design/html/lts-users.html (people-list template), with Edit/Delete buttons instead of the row menu. */
export default function UsersPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list">
      <Suspense fallback={<PageHead />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
