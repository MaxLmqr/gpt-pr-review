import * as core from '@actions/core'
import { getLineToComment, parseHunkHeader, shouldExcludeFile } from './utils'

jest.mock('@actions/core', () => ({
  error: jest.fn()
}))

const patch = `
From ef561397a528073abaa5b8ab3270aa5347f30a70 Mon Sep 17 00:00:00 2001
From: MaxLmqr <max@galadrim.fr>
Date: Wed, 27 Mar 2024 12:07:34 +0100
Subject: [PATCH 01/16] fix: clenaup logs

---
 src/hooks/useFavorite.tsx | 2 --
 src/services/api.ts       | 1 -
 2 files changed, 3 deletions(-)

diff --git a/src/hooks/useFavorite.tsx b/src/hooks/useFavorite.tsx
index d64b979..2724d6c 100644
--- a/src/hooks/useFavorite.tsx
+++ b/src/hooks/useFavorite.tsx
@@ -45,11 +45,9 @@ export const useFavorite = () => {
 
   const downloadImage = async (id: number) => {
     const response = await apiInstance.get(\`user/picture/\${id}/download\`);
-    console.log(response.data);
     const url = new URL(response.data[0].url);
     const kValue = url.searchParams.get("k");
     const nValue = url.searchParams.get("n");
-    console.log("kValue, nValue >>>", kValue, nValue);
 
     if (!FileSystem.documentDirectory) return;
 
diff --git a/src/services/api.ts b/src/services/api.ts
index 23e6b24..bcf4a73 100644
--- a/src/services/api.ts
+++ b/src/services/api.ts
@@ -28,7 +28,6 @@ apiInstance.interceptors.request.use(
     return config;
   },
   (error) => {
-    console.log("eoirueoriu");
     if (axios.isAxiosError(error)) {
       console.log("error", error.response);
     }

From f6bc398469601844f4c01abb277b8f779504766a Mon Sep 17 00:00:00 2001
From: mehdi-111 <aknoun.mehdi11@gmail.com>
Date: Wed, 27 Mar 2024 23:39:28 +0100
Subject: [PATCH 02/16] feat: dynamic data fetching

---
 package-lock.json                    |  25 +-
 package.json                         |   1 +
 src/components/Button/index.tsx      |   6 +-
 src/components/Dropdown/index.tsx    |  13 +-
 src/components/MasonryList/index.tsx |  16 +-
 src/hooks/useAuth.tsx                |   5 +
 src/hooks/useFavorite.tsx            |  48 ++-
 src/hooks/useRequests.tsx            |   2 -
 src/pages/bookmarks/index.tsx        |   4 +-
 src/pages/imageDetails/index.tsx     |  15 +-
 src/pages/login/index.tsx            |   7 +-
 src/pages/settings/index.tsx         |   4 +-
 src/services/icon-sport.types.ts     |   1 +
 src/services/user.service.ts         |  24 +-
 src/store/index.ts                   |  10 +-
 yarn.lock                            | 589 ++++++++++++++++-----------
 16 files changed, 493 insertions(+), 277 deletions(-)

`

describe('Reviewer Functions', () => {
  describe('parseHunkHeader', () => {
    it('should parse valid hunk headers', () => {
      const header = '@@ -10,5 +20,6 @@'
      const result = parseHunkHeader(header)
      expect(result).toEqual({
        originalStartLine: 10,
        originalLineCount: 5,
        newStartLine: 20,
        newLineCount: 6
      })
    })

    it('should call core.error on invalid headers', () => {
      const invalidHeader = 'Invalid Header'
      parseHunkHeader(invalidHeader)
      expect(core.error).toHaveBeenCalledWith(
        `Invalid hunk header: ${invalidHeader}`
      )
    })
  })

  describe('getLineToComment', () => {
    it('should return the correct line to comment on', () => {
      const hunk = '@@ -45,11 +45,9 @@'
      const line = getLineToComment(hunk, patch)
      expect(line).toBe(17)
    })

    it('should return 1 for invalid hunk headers', () => {
      const invalidHunk = 'Invalid Hunk'
      const line = getLineToComment(invalidHunk, patch)
      expect(line).toBe(null)
    })
  })

  describe('shouldExcludeFile', () => {
    it('should exclude lock files for npm', () => {
      const fileName = 'package-lock.json'
      expect(shouldExcludeFile(fileName)).toBeTruthy()
    })

    it('should exclude lock files for yarn', () => {
      const fileName = 'yarn.lock'
      expect(shouldExcludeFile(fileName)).toBeTruthy()
    })

    it('should not exclude other files', () => {
      const fileName = 'index.js'
      expect(shouldExcludeFile(fileName)).toBeFalsy()
    })
  })
})
