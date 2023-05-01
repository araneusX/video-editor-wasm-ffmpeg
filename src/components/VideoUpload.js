import { Button, Upload } from "antd"

function VideoUpload({ disabled, onChange = () => {} }) {
    return (
        <>
            <Upload
                disabled={disabled}
                beforeUpload={() => {
                    return false
                }}
                accept="video/*"
                onChange={(info) => {
                    if (info.fileList && info.fileList.length > 0) {
                        onChange(info.fileList[0].originFileObj)
                    }
                }}
                showUploadList={false}
            >
                <Button>Upload Video</Button>
            </Upload>
        </>
    )
}

export default VideoUpload
