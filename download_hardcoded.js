const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const outputDir = 'C:\\Users\\Daniel Idonor\\Suler EMS\\stitch_exports';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const screens = [
  {
    "id": "b5a7c344079941a6969286e36b105d70",
    "title": "Suler EMS - Role Management",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uhxt4N6oFH4CVA2-W5v-GUw1PT4mzVjeRByy4Ou9Y4zOu-eonx21rGMkkUTHMaQ7jxmzaxiHf2K9UAYk8LadS78jsSQpayJ9p0EUNLwuaXmn4P23MKorYAgTkhH3NsVJYHyjFUTB19LacbH82kQnJDhouQQG-J6tP-cXrgQiRQefFDF67gMB90F7Z1kBLiZRMBMNv0PE1QcMhRTf0ktRL3A-mwwk2eD6ICDcNWbdlPbWxdyjfAVYMFjAZ8",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzMyN2VlODFkMzY5MTQ0YmVhNGE0OTdmYmYzNDdlOGMwEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "aaea5ff572244444b887c816aeb06664",
    "title": "Suler EMS - Audit Logs",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ui2JD9riNOmpGLUo0vCurIw8c4AuGdWKKbP5edXY70XYV7XX2KNIjG_Dv5rGFnwdm1nooi8s5qVeEdZLwjPOK7vzdwAhul-JWijk_t_IgaZvJG37TpMO2TZEWkcINY-614ec2iJxD10JYYCOhUhF7_avH5OJDh6YOyoKrViZXtnqolEl5QGD5A0oNXn4s8HHgyrsSO0W0b6k6cQCXmISBsOVQ6V0_kAIhCaGcWyBWr7FjbHDaYziJK2bSnp",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzNmYTAwZmQ3YTFkMzQ5NDA5MGUyMTdmYmZlMzYyYTEzEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "45a7bc0a102e44d3b9dc7d1a8213598a",
    "title": "Suler EMS - Performance Insights",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ugFSKls6dsPZR2PAe28VQYlo5UwPB3ED5jMTHa1xKlgAQxKFnKzmPcmtype9UdZWqaKf4zT_YTswLvXjNEMWBBZT1Z3F3FhjlgyZRAJEWh7MEns2KZ0ctpiD6gW5M8_rn9DQidQyR0Jz3kw53NBiDTI6C4kEXktX9cTBGhmznYN7ICbVNnncFxOm6BPGWbuwiR3L7DxnRB7qSYI088Wm0Bue4B7MaTfT-LI3yCySXR-3QE754VoT3bCINkS",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIwYjZhMDRmODYyNDQ0OWZhZDU1MWRiZTZmZjNlZWJkEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "4a3736d18fa9415aa3e51128e879f872",
    "title": "Suler EMS - System Settings",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiZTPAY4Hoc63gLwWVy0db7oU1Y_fdPmdhJplwg-JRMF1t2OM9zjtBPpj23RoNY71RMfhfcB5pXkpTPDXCG7CfaXarhRvrBNmXb7twYokiPmYt1yH6rBysn2VuPQrIJpIpW8A-y_DY2K0XeFE5azs4QdvgcDe4D8-iddnuOhMCvXMXuE0605GHlQSkYa3IUalswYq7y6g9arFU3uYV_48F2HGv46_FMpMQjoo8bLEH2N-ShxdtOuVBWhRc",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzFkZDMyNDNmMTI2YjQ1MDNhNDRlOTU3NWY5YzI4Mzg1EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "88ef236fd8384606a752c955294b02f4",
    "title": "Suler EMS - Organization Analytics",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uj7_n53S7XF0RUD0ioHE8i-gPkcMVSSy4rbbv40Kw1kvPukxc5sY5p_4ji4OH7yW969k4XDPpazUFU3VOxnx66bWMonT7EcbhVm9Ljp3m_8TqO8rtYav9r0IG2KFmR93uJ3GS0DkMKW5zME_WagPQqWl_AYXj2ddtHKW5HLlTBgLZOCYKdOsvnMBjGE3kTt9toOzHE-PrkPc2YoNJGqhJzgXpN71fSLGc4Kt4v153Y3dtSYVScagEWoJoJ8",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RmNjllN2U4NGY0ZjQ1Yzk5NTBhMWUwZTJhNjMwY2NhEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "682085c5de8640b58e94334e3d4d5b89",
    "title": "Suler EMS - User Profile",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiN5VmfXj-cmJUOKUTTA66cZbq0IQn2MuR_awoRYeJwoPHCdPWRkR7u8o1XNsT0T88QvkwaLBAKqC_kwX3jyYsWD8iVPNpBABLA16ig9KHoDp37mDVyXXOMjCVAj9Q2DZQiyeA3q8RVgg92fVAEPtK3Xl-GcT9x-H0IYpbn0RveSibFhNVVha4ff-e9Jsmu1hN4XX-aeVoakIgISegW7Mh9z-RRgYum0GmF129vshdPCNofo16rgj9yGO8e",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzNkMTUyN2JmY2Q1YzRhZmVhZGVkOGNiMzBiMTI2ZTdkEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "25b55b43b76543d68ba3be3477916e85",
    "title": "Suler EMS - Notifications",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uhm7Lm20jC8s4KgqY_qYBoKREyNm1QcyHKcesUVQaXYhEfHkiVc0mhPXkFuFt4_P1bpZReqRbe9i6NDPZ6YATqdwp20QE8DVxYxG71Kckp-a5d6UWLS234G0I7KCFcCjrUoYDF8BztvAQIeKm5x1PSJ2DPuyzlGF8I6eScjOsIH7uvvhEj4PpNJKrUl48SxHLkYeSfpKYJysxupYFnfGJwpYNW8Min1z1hyzGEIlJzC_r0sjd5PE4c2Y69K",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZkOWM1NjlkYzVkMjQxYWRhZTNmY2U4MTY1NTFhMmIwEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "7b77ae1f8d1447adb4d9cf2edc539363",
    "title": "Suler EMS - 404 Not Found",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uhRHnCCffETaNGsPQQebTDxTx3hB48S0C2pmGAn_BiICN5CdBMsSxYranYdX2CxWogVdXJqvxghTQXo8K9li74FX502LmFMsMvL-yt_XHEPlKBxV0jKm84-WPLLeseyFSccYtBu-cLPCipiasiByDN8bkl8WJ4VZ4nbagcjewHtxG3LRmZUzJO6wfPgIOAGX7LLLLfqFZ9_Nk0G5YGw84G72hMVZCkkq8CiAv1QZCb6ryLGXsFdxW58rky7",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk1M2EwMjE4YjdmZjRmMGE4MTZjYmJiOWUyYjY3M2YyEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "f1250abf73a74b15b071b6c40d9ed2bd",
    "title": "Suler EMS - User Profile",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ugCQC5mHomi7_Tum4uulszQtQOEIq1nLgZxhsr0A83qHzK75OIOPHzRKePRPSpHGBv4UWJBpxqiNJGxD6VYWNNKqbv06u4wW_esPtWz9uvSCcW7MvbOhhyxwJC-VAD5EpbOfZDUGc_t0fWEpoGSk4BY4jKgGeq1pnMSgTkOyx0USaHsR0tfHWl9yGHqScymxXBw1vdG6V3fiP4wNZin68Ak8vGu24KKvh2kj0pzC9PQCbAtgu3rbAAd3hE",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzg0NDM0NWZjYjg4MTQzMzI4ZDllNmVmMzhjMDU2MjRmEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "fcb7bb17782e4032a180810c83b6a96f",
    "title": "Suler EMS - Login",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uhzwXsF2UUS23vYBnkbR2_A6QDyIDLGnGRiI7i22gGABLx12lRwZP3kKhYMXs_lQ_bFy-KbP1Bxb5HPJuozLX1cqWYlXkj6uuDtWooCHWjstjgiaLdlCPWHHJ1BcvRjhgqwR9EmU4EZrgEMI7pSfX6WD-PZ3xKbvxUpulcRogEg5Mi1Eg884a_l-voA-HwSszGB4WsFjxRZQF5tklyR4Ju4BrJXM2VEur2jy5RKboXMEr6sGFLJTog_i3pT",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VmZWJhNjQ1YTg3YTQ0MTc5ZDExYjlkZWU0Y2E5MzY3EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "6865eccc6ba54a7f93c2da8ff1636bc4",
    "title": "Suler EMS - Notifications",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uj_TP8L9iCeJRD8GJRim3JnvX8YJe65cxJTBL9fI_MyOZjcQAtXnDhZIoUkytsCHMHVSfIG6-ETiQdbMlm5uPuri8ly2ytL3t7BudGUL73P3Iy_H9HPaj2PZPdSOQvvz_p53VtMEmKKh_SFBHxRZD_drGEI11LJU3CLPkhSiDIblpvDcDjf6zDcoQK9iXfvGuAI3ng_j7Ok6gkJfDsGw_TqcY1u5-tO7RjyAB_JTViZsM-hOBHWXXIu0R8",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Q5MDQ0YWRiOWY2ZDQzYjViZGMzYzlhNGQ0M2UxODJlEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "433cf7cedd6d42c796cedd9c4d5f2070",
    "title": "Suler EMS - Salary Structures",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uj9OuXjy5uqbalkNdGgN0IR2Ahx7LYe7MRkA5J1ml-t8xVvzd4UAetZZNJNIHd9aqLyDrEzrhQ1ywoHUGWD58iLEHXH-3ROrjqsw-VYaHmOezYCO0daLM8C12o4_O-eabu5xX9oIaSTsaFlgRNClNS1jsTBAgD8yTx16bN7proA_BY1N7nerAY-J-8dXFfG0FcxV_QwVL-SBxVNTWKzI4tYT5cOL-qxTbyKLI67VSlYMQlGZGuQTjOPBATD",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIzYmVmMjQ3ZDkzMzRjZTE5NTViNjJhZmVhYTMxOWM2EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "49595fc6a73d4102bfaddd9580008ea2",
    "title": "Suler EMS - Payroll Overview (Admin)",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uid5H81XzqHwoFj_VlEfHGdWps-6Rsk7rMLQElbNZbft_jJfN_wJTx3DDkLurpQ7994-OFpW2qxuJd-5b3BpfFGy62TrXxnJCS4Z1NgccFosL6-d4SkKilYnbQZi62oWPne4EuV-dfSDYksZ8s7cEPt9pfpjDYGaEJZM1sVNUPWA5yPnomzQ74MO3q3LJScvvAABYOoNGQdhFYrbvs-F3my2TQwCQCOSZvA0F8Zy92QconehXsRBXGtInk",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzVkNDY0ZWM4ZTY2YjRhMjdhZjNjMmJjNjg2NzliYjk5EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "4289b4cd383f40f8aad6190114da8bdd",
    "title": "Suler EMS - New Leave Request Modal",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ujpITglEsL78CGlt4opPUbHbOhQZsiO9EzGUvDBt-wozoSasytNIlCj5_Fvnfgr1RxUMfCKODu79RAayfPHcCXZiWPXLDQcwibfTkADyx_5qUDaFu-2MiMAtemMFVlPRh5OKgCrABfnOxRj4GFXPnurf0o41i4JqARgkPoQN7NuMlAaBH-cfWGrDS_c2HbC_qwRHM0nN6qHXb51SLakDM3REqK9O-YhJVIfkcbLwv_p71NPA-fBMQq4LsPj",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzYxZDM2MzlmZjY4YTQxNjY5YTk2MzhkYjk0YjI4NzY2EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "63d6e3de4cde494baaf321786d97ed1a",
    "title": "Suler EMS - Attendance Correction Modal",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiGpmHIY-OiImuIL-agLR3BnZ1QOGptu8zbGU3CNCWy35JAay8HDAi2QI8bzq6bWCpeEad31QTqAvgTD65c8l1VVA6Ati1ajaDj3dYdPCttLIeXvgQOT8OBErVlqi4YWLZvdfPkAdYfgr9rQdv1a-O3ogQCqw5bAIw5NbTvyyRfvBI_owUNtqgCtz1WpWhzxtKYYz96WIakSFBrzv4Ote82n3I0z9NNA5o16EA8GvY_0X73YQQmBR9L9xLS",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VmOGEwMjE1YWIyMTRmYTU4NWM3ZmJkNDRhNWQ0ODBmEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "a11e05e0487742b881a13579d5e666ac",
    "title": "Suler EMS - Role Permission Editor Modal",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uglElhFpV8ZY8_nxCzazydb5Lo-Jbyziagfr0edJi9Hulwayt30X5_v2OfnJ_xANmqwuNUJ6VdSmhdC9OJtAlVjPH1yoc0cp_Pc6NvMgdPIoHJ6juzvR_C5PUcH8p3dcjnFsyK7-trIqLzoEyN2Ao9Hi-m64SdbvEkv49a4pXBCJF5bW1nOQRafUoItGyW1YTPElKJCwugYx1YsfyNNMbY6_qb0AXtPA4YwwUFf-rqIQPx1TU8rVLanrm_q",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2IwMzQ5M2UxYjg4ZTRjM2JiN2U5ODFlMjBkYmZjNThmEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "d7b817dcd38a4bed9d86c8210494b57b",
    "title": "Suler EMS - Add Employee Modal",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ugGJruOdJpoFMFvzsnAGysZ34AZGu2g7oEcPc5cCbZcsy3vWnJCfcL57DBJozfBic63Ac4DegqkKKr90PQOYapOh-8Wnv3AlOmu_rmiLJLukMlX5QMj5wvYZlOc1Ro6Y9ERWViUCe8PtzH5TWO27N5SUFz2x6WO7aQbzGr-LxsErAG9Sece6_9myaaDG5B0G20MJ9oPgcjGeHYSBDTihej3CZwdXmpmBq5KGnLcdKvzSXDnJ5lsuuDH_FbN",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQzOGM3NTNjZjVhNzQ0ODliYjA5NTA3ZWE3MzFmNDI4EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "fb3915d79ec64b81b89698ccacda826d",
    "title": "Suler EMS - My Paystubs (Employee)",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ujGs_D45v9USZpqnFyj3tXoXBZPk2CmWLU3HUmOWmNL2J4CuMm0Pp69Vvms3cvZBJVpi2GauB6ax2XTB2HPTVDznJQ1pMvd_oQH3OwViSp9rONCkecpstIfwxPz9mtUB6ZZtYwi3e8b5It7KQLdKqC-Gm2xH60ZpI4cAwJPdygWdFbII9NtMJv84MH5v1hgwxBtWo6jJr5H4_LoDwhF1eD7eLmOCt54jL8jJCzJtnJ4Lnr2AnlB0Jp96Vi5",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2FiMGU3Y2RjMzEzYjQyNGY4YTRmZTAxMTAyY2RhYjVlEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "ad47496f50404fb18c0b5c3f19e607a3",
    "title": "Suler EMS - Payroll Reports",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ugBVxxm8s-D2Ee7zqBD3OPshN6PQKWWmqZzzMEjmN_TrzrRf8xwYdoN3wGpFO9b2buPuua9i9wxjFunRL7NoaGKk8gQIoWFTOt-SWxM0lzxrz15_LVdN6vHya6Srfg6ONh_9oY23Zr1OaQNIShupmTRf7bnzIRnsb4NRCG2Dp6QjmwsmSHrvgTKrEj96IRA8HNZEORP-uDPQtuYL5DClepEdpakLssHcC54WJvo7LxITQMXitzOnKS8YngE",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VlMmQyNTQ2ZjkyNzQ1ZGE4NTkzZGZhZDI3NjFiNzE0EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "c9cd19c71ded48ee8a260e853fbc9729",
    "title": "Suler EMS - Payroll Processing",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ujonaWssx-DwWJr_yo5BkXXJW1SwKBBx5qdPe__lD35UbM2v-80umdD7_WiKD6khh0MSUx9nmGqIesncp_2A3o-KwK5nMq5Hk7Fyc6a8b94fSqDKxT-JqF1t0T7SythDrbERiP3foCuHcmCzAnGOYS4bDyiawY35MI-LAXbTZrcVzTmIJGg73I_XkXrv1f2p0sLIgQsNH_Jd7Hfrluf0D3wFpRlpzrG0HAGtVlJfw9NtEGu3J5zLwuLPlWd",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RiMGFkY2M4YmZiYjRkYjM5NmM0YzRlZDcyYzAxOTQ1EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "17f6929224714f3f927e70122efc40a8",
    "title": "Suler EMS - Attendance & Leave Reports",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiaLz__iwnGZwYsfunfGsMYh2W8Suul6LXlVhOd-tf6QFpNVTMJIHyWrTXoPMzbmeYPOIjw8HTDDA4C4XWc9RxP_u6gta52yHBAsA361Slj9l764K2vdRY2vZfMoTIrFW-xm40Cjh53APk3IiM1iOqocnXm-uLDRXP1TnFneCawlLDfX_NMggXIQClqOhb0lx15mDeqVQ5UMMs2orpw257tan2IUmSsHJjOzih15JmK7ptNXtKxnor6ats",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIzZDk4ODc3ZDdlYjQ5Y2U5MzIxOGUwZTYyNjU4MjZlEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "db101b0750cf47888c46d72a59274ef7",
    "title": "Suler EMS - Audit Logs",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uif2btu2CUaUP5Dx3-PZMmiKQTLAuXEDe0qdB66x_-WupuuE3V5EM-IxzFaBsDPvPnXjJ9V2m8foJNEgB1-zhBz0uW2bDDonJJqa1pkx5rnIcq4zLsSUBzuNlxBR-KBh9EDYkWqfq0xCCxzd5RddLSMui_K2maYKVsdAE0aZJeO9aGZBbEzE2Hi2w7Z3JGAF4aPoEq9WlofueZpEdVywIm-mHCltvKtJ5uHZSBr-LT1cFd6I0jK8dpHHxw1",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MyNjllYjA3ZDUzZTQ2MWQ5NWI3MDdkYmNlYjM4NWI5EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "fdfa5a57daf846bf82d8a65b861289c4",
    "title": "Suler EMS - Attendance & Leave Reports",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ugiavShTJkBt-Rj9OZTKlqc2WptjMK6_1qG-0YUxmIXLlWTft7rFqaWdxL-PITw44nkiH_ExLwxXiKtDKHxFNk_3A7srex-mX3wakGzMMztcHEEyMvGnBIYoJz8sBFoXXfOoabgzQpBCTn025LDJ59E2WeeH5OhN2u_zhlUTtYS_6tCOO-Y9l4nP6zOCLky750EvNnzyruRipbRBOsflgYt3ZSOgSv5-NrPVopwkBh3OJs6Rp7wQrUiR8k",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQyNDVhMzEyZDgwMzQ0MWNiYzQyMWZkMWYyMTNiZTQ4EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "f5d841c4bf9447a582ae3196b5eed589",
    "title": "Suler EMS - Attendance Tracker",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiE7d-EUMnOMUNZKGcL9dm8xPGFTTFzyLg0tRPwx4I9a0ADXhKQk8VMujA9YiLukHclTm0wNrvcC4z12oIqqdY57Fmh40JNOLKEChx0HSSpkQa4SeXuNZHWLFrmcg3wPuRBBCdzhwZ7jMKHOe-Sj6FEbpuzvdYHcfrKcyZRXNsodd-4qLvLhKCyNkVY8otkPUu420p8PukW6kGRmP1h3vm5Y0OoF8qCTy_EDrwobbdj7v3EVRdEt2G4kaUr",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU2MDYxMGM1NTBiNTQxMjY5OTEyZTI4YjJlOGYxNTQ3EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "fa6aa711de644364a18b3ec387c51498",
    "title": "Suler EMS - System Settings",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uh-Qf56awQPY3GO-YVuMXVedu7By35inz1pEl9Js5d0XVw2x4nwR5lpnOzG8yjBDDn8wO36YN6H9fRU3f17WhDepwwFh608gUhna7yHzsV1-uk4LDC2VyiMp7VQuirZX4R_7LWTBH9Q_dXXIu64THsGnQZPpsu1mzS42b2zNJJ7_C8PfGAC4_UyM2auGJ34nuJkq4ciNPJP6YX7bSef0lpMdNhVnRcmuv_r5UR30oUvTxRQGVbb0dgWXKVH",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBjYzQ5ZDE5MzcwZTQ3ZmE4MzA1Y2I3YzU1ZWY0ZTdjEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "4bd529995b1c432896c353383d441102",
    "title": "Suler EMS - Leave Management",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uijkC2nnXXqv-dawmncxOEwm8b74vl8fdz_xQph6OyUXpb-a3i2WL8EZhSeySZae7ZvuTokQo274T-teFS-GgzLzdI13i3qtxC8EZgta-P4EWYRQqZGTUj5W63fS7B9zxh56tpuUSWSNRmMrsl6mKe5W6KTQzcTnjivc7Hc6Y87QgmOYmMgK7Coyyr9pPHLDD9dNU4KlKVV6M1jV-C5e2eoTkWWoEa7s434jqJu8q588WyqHYuxkwF_O086",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU1ZWY4MWMzYWMyZjRhMmFhY2E5ZGU2NjMyMDAzMWFlEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "7eb5fd9ed68a41fdaa9549a888bd1de4",
    "title": "Suler EMS - Role Management",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uhrYtJUkiG2J-V2uqvLbuWri59NqWfZAgXm-ruF5di35lM9RDY5_Asdln0OMaU19vmI4MG5yM19FaB7astrAq_R39lQr-4bIgbmscbd_d3aE7Rs823vYwPEOaMAjW7ZAJyVzwAZFhE3JIcj5AXunB6NTeOmbG1poCaE1MlQZh43VWlGR7Q33Rm6NfJMlapX2uCWzgXur8PJbKzlhH3wTGCrl3Q_vCOpk39xTwR6lcrKIaVgJT0Su-M2msr-",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2E5YTUzNTMwYjBmNDQyZjc4NzA0ODA1ODA2MDc3NGM1EgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "8551b3721fd7484da26178e5fbd90d73",
    "title": "Suler EMS - Employee Management",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uiwkt49hhaYfSr8uyX61OIBcrmiwJPHNAQdA9kErt3cmTavhL9hK2sVbFgRIjktzRSrnhhrf7NhtgzpY9nQHC0mcYeDZ0--879L376yZIm-HAWrZ43WqREUEpbbwymVzelAPpevUUCExyPgeRsSWcjcmhsvBaX7d-ZoP3lKPYEu8MB7CC7mLZVYrqRBEOBPGD_vVRZxCZTSfWXwfc_DUIjuD9LMk-sEILkyxvZ-P31HAvaGmomYP6CQ-urp",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZhYWFlYTRkZjAzMDRiMGQ5YWZjNzI2N2ZlNGVhNWFhEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "362250d229f947369b9d3adf965153e2",
    "title": "Suler EMS - Employee Dashboard",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0ui9CXITEmp9_2OwYD00HsnwTqXaY4QtW65UZJFyqxUOU1QbRDPNXLt0ZCQox0525kKkVbEPhEio-ew8Gd-k70y_q_logeBX8_FWMJCkgJlNf0vzv98rftDrz1-q1o6SDshibiy-aP0Huq9H4jJLwkuIdkS5OIEprzYNE-LeELU8S6i3QEE2YjvL89OOkts2ucUyOI5lAxWNNpvohVMkTVX9IL7C5Ygulrd032BPZZG7Z_vUkDvOwsfloXYL",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2EzZWQ2Yjg4NzhmYTQxZmI5OTFkZThjMDQ4ZDdiODcyEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  },
  {
    "id": "7ea3330f992341ac9e65fc94d31f4a73",
    "title": "Suler EMS - Manager Dashboard",
    "screenshotUrl": "https://lh3.googleusercontent.com/aida/ADBb0uijPStjwErLrvcqZqSE4Jopbcp9PjNISf--21Q-OknRsdyTv_C4N62x3YL4LC2XhAleEv9RZBRHAsnZhl54YO0KeRiDhGVYD79WIg7YLFJg9fma7oA7HryGruimvHDPvpRmjXxAyLSdMRu9KHfbp6dBRPyL7-7kuKBy7GhsSsuJbneaXqeW4CIt5vCHVHcjxK0z7gexwiYREW37KSnlLh9VNUi5LNSlioVX8f_jyHs8dWOlLeMfiUFUDSG9",
    "htmlUrl": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzg0N2EwYjVhMjI4ODRlYjk5MGFjNzhmMWFlM2YzMDMwEgsSBxD4rMau6QkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDA2MDk0MjM4MTU5Njg1MjMwMQ&filename=&opi=89354086"
  }
];

screens.forEach(screen => {
    let safeTitle = screen.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const imgPath = path.join(outputDir, `${safeTitle}_${screen.id}.png`);
    const htmlPath = path.join(outputDir, `${safeTitle}_${screen.id}.html`);
    
    console.log(`Downloading ${screen.title}...`);
    
    try {
        if (!fs.existsSync(imgPath)) {
            child_process.execSync(`curl -sSL "${screen.screenshotUrl}" -o "${imgPath}"`);
        }
        if (!fs.existsSync(htmlPath)) {
            child_process.execSync(`curl -sSL "${screen.htmlUrl}" -o "${htmlPath}"`);
        }
    } catch (e) {
        console.error(`Failed to download ${screen.title}`);
    }
});
console.log('Finished downloading extracted screens.');
