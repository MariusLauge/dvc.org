# get-url

Download a file or directory from a supported URL (for example `s3://`,
`ssh://`, and other protocols) into the local file system.

> Unlike `dvc import-url`, this command does not track the downloaded data files
> (does not create a DVC-file).

## Synopsis

```usage
usage: dvc get-url [-h] [-q | -v] url [out]

positional arguments:
  url            (See supported URLs in the description.)
  out            Destination path to put data to.
```

## Description

In some cases it's convenient to get a <abbr>data artifact</abbr> from a remote
location into the local file system. The `dvc get-url` command helps the user do
just that.

The `url` argument should provide the location of the data to be downloaded,
while `out` can be used to specify the directory and/or file name desired for
the downloaded data. If an existing directory is specified, then the output will
be placed inside of it.

Note that this command doesn't require an existing <abbr>DVC project</abbr> to
run in. It's a single-purpose command that can be used out of the box after
installing DVC.

DVC supports several types of (local or) remote locations (protocols):

| Type    | Description    | `url` format                               |
| ------- | -------------- | ------------------------------------------ |
| `local` | Local path     | `/path/to/local/data`                      |
| `s3`    | Amazon S3      | `s3://mybucket/data`                       |
| `gs`    | Google Storage | `gs://mybucket/data`                       |
| `ssh`   | SSH server     | `ssh://user@example.com:/path/to/data`     |
| `hdfs`  | HDFS to file\* | `hdfs://user@example.com/path/to/data.csv` |
| `http`  | HTTP to file\* | `https://example.com/path/to/data.csv`     |

> If you installed DVC via `pip` and plan to use cloud services as remote
> storage, you might need to install these optional dependencies: `[s3]`,
> `[azure]`, `[gdrive]`, `[gs]`, `[oss]`, `[ssh]`. Alternatively, use `[all]` to
> include them all. The command should look like this: `pip install "dvc[s3]"`.
> (This example installs `boto3` library along with DVC to support S3 storage.)

<!-- Separate MD quote: -->

\* HDFS and HTTP **do not** support downloading entire directories, only single
files.

Another way to understand the `dvc get-url` command is as a tool for downloading
data files. On GNU/Linux systems for example, instead of `dvc get-url` with
HTTP(S) it's possible to instead use:

```dvc
$ wget https://example.com/path/to/data.csv
```

> See `dvc get` to download data/model files or directories from other <abbr>DVC
> repositories</abbr> (e.g. GitHub URLs).

## Options

- `-h`, `--help` - prints the usage/help message, and exit.

- `-q`, `--quiet` - do not write anything to standard output. Exit with 0 if no
  problems arise, otherwise 1.

- `-v`, `--verbose` - displays detailed tracing information.

## Examples

<details>

### Click and expand for a local example

```dvc
$ dvc get-url /local/path/to/data
```

The above command will copy the `/local/path/to/data` file or directory into
`./dir`.

</details>

<details>

### Click for Amazon S3 example

This command will copy an S3 object into the current working directory with the
same file name:

```dvc
$ dvc get-url s3://bucket/path
```

By default DVC expects your AWS CLI is already
[configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).
DVC will be using default AWS credentials file to access S3. To override some of
these settings, you could the options described in `dvc remote modify`.

> We use the `boto3` library to and communicate with AWS. The following API
> methods may be performed:
>
> - `head_object`
> - `download_file`
>
> So make sure you have the `s3:GetObject` permission enabled.

</details>

<details>

### Click for Google Cloud Storage example

```dvc
$ dvc get-url gs://bucket/path file
```

The above command downloads the `/path` file (or directory) into `./file`.

</details>

<details>

### Click for SSH example

```dvc
$ dvc get-url ssh://user@example.com/path/to/data
```

Using default SSH credentials, the above command gets the `data` file (or
directory).

</details>

<details>

### Click for HDFS example

```dvc
$ dvc get-url hdfs://user@example.com/path/to/file
```

</details>

<details>

### Click for HTTP example

> Both HTTP and HTTPS protocols are supported.

```dvc
$ dvc get-url https://example.com/path/to/file
```

</details>
