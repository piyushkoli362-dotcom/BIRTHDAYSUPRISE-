-- Private staging area for direct uploads, avoiding Vercel's request size limit.
insert into storage.buckets(id,name,public,file_size_limit)
values ('birthday-staging','birthday-staging',false,20971520)
on conflict(id) do nothing;
create policy staging_insert on storage.objects for insert to authenticated with check (
 bucket_id='birthday-staging' and (storage.foldername(name))[1]=auth.uid()::text and
 exists(select 1 from public.birthday_pages p where p.id::text=(storage.foldername(name))[2] and p.user_id=auth.uid())
);
create policy staging_read on storage.objects for select to authenticated using (
 bucket_id='birthday-staging' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy staging_delete on storage.objects for delete to authenticated using (
 bucket_id='birthday-staging' and (storage.foldername(name))[1]=auth.uid()::text
);
