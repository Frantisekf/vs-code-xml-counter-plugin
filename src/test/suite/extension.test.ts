import * as assert from 'assert';
import mockFs from 'mock-fs';
import { countXMLFiles } from '../../../src/extension';  // Adjust the path as necessary

suite('XML File Counter Logic', () => {
    setup(() => {
        mockFs({
            'workspace': {
                'file1.xml': 'content',
                'file2.txt': 'content',
                'subDir': {
                    'file3.xml': 'content',
                    'anotherSubDir': {
                        'file4.xml': 'content',
                        'file5.js': 'content'
                    }
                }
            }
        });
    });

    teardown(() => {
        mockFs.restore();
    });

    test('Count XML Files in Workspace', async () => {
        const count = await countXMLFiles('workspace');
        assert.strictEqual(count, 3);
    });

    test('Count XML Files in Empty Directory', async () => {
        const count = await countXMLFiles('workspace/emptyDir');
        assert.strictEqual(count, 0);
    });

    test('Count in Non-existent Directory', async () => {
        await assert.rejects(async () => {
            await countXMLFiles('nonexistent');
        });
    });
    
});
