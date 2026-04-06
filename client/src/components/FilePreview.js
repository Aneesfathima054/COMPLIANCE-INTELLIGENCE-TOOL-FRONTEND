import React, { useEffect, useState } from "react";

function FilePreview({ file }) {
	const [previewUrl, setPreviewUrl] = useState("");

	useEffect(() => {
		if (!file || !file.type?.startsWith("image/")) {
			setPreviewUrl("");
			return undefined;
		}

		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);

		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [file]);

	if (!file) {
		return null;
	}

	const sizeKb = (file.size / 1024).toFixed(2);

	return (
		<div className="card mt-3">
			<div className="card-body">
				<h6 className="card-title mb-3">File Preview</h6>
				<p className="mb-1">
					<strong>Name:</strong> {file.name}
				</p>
				<p className="mb-1">
					<strong>Type:</strong> {file.type || "Unknown"}
				</p>
				<p className="mb-0">
					<strong>Size:</strong> {sizeKb} KB
				</p>

				{previewUrl && (
					<img
						src={previewUrl}
						alt="Selected file preview"
						className="img-fluid rounded border mt-3"
						style={{ maxHeight: 240 }}
					/>
				)}
			</div>
		</div>
	);
}

export default FilePreview;
