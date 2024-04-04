import * as core from '@actions/core'
import { getLineToComment, parseHunkHeader, shouldExcludeFile } from './utils'

jest.mock('@actions/core', () => ({
  error: jest.fn()
}))

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
      const hunk = '@@ -10,5 +20,6 @@'
      const line = getLineToComment(hunk)
      expect(line).toBe(25) // 20 + 6 - 1
    })

    it('should return 1 for invalid hunk headers', () => {
      const invalidHunk = 'Invalid Hunk'
      const line = getLineToComment(invalidHunk)
      expect(line).toBe(1)
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
